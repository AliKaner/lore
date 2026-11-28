/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api, components, internal } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

async function bookWithChapter(t: ReturnType<typeof setupTest>["t"], authApi: ReturnType<typeof setupTest>["authApi"]) {
  const owner = await signInAsNewUser(t, authApi);
  const bookId = await owner.t.mutation(api.books.create, { title: "Kitap", visibility: "public" });
  const chapterId = await owner.t.mutation(api.chapters.create, { bookId, title: "Bir", content: "{}", status: "published" });
  return { owner, bookId, chapterId };
}

describe("comments", () => {
  test("the writer of a comment and the book's owner may delete it; others may not", async () => {
    const { t, authApi } = setupTest(modules);
    const { owner, chapterId } = await bookWithChapter(t, authApi);
    const reader = await signInAsNewUser(t, authApi);
    const stranger = await signInAsNewUser(t, authApi);
    const first = await reader.t.mutation(api.social.addComment, { targetType: "chapter", targetId: chapterId, content: "güzel" });
    const second = await reader.t.mutation(api.social.addComment, { targetType: "chapter", targetId: chapterId, content: "çok güzel" });

    const seen = await stranger.t.query(api.social.listComments, {
      targetType: "chapter",
      targetId: chapterId,
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(seen.page.every((c) => !c.canDelete)).toBe(true);
    await expect(stranger.t.mutation(api.social.removeComment, { commentId: first })).rejects.toThrow("Bu yorumu silemezsin.");

    await reader.t.mutation(api.social.removeComment, { commentId: first });
    await owner.t.mutation(api.social.removeComment, { commentId: second });
    expect(await t.run((ctx) => ctx.db.query("comments").collect())).toHaveLength(0);
  });
});

describe("deleting a chapter with what follows", () => {
  test("the owner deletes a chapter and every continuation, including others' branches", async () => {
    const { t, authApi } = setupTest(modules);
    const { owner, bookId, chapterId } = await bookWithChapter(t, authApi);
    const two = await owner.t.mutation(api.chapters.create, { bookId, parentChapterId: chapterId, title: "İki", content: "{}", status: "published" });
    await owner.t.mutation(api.chapters.create, { bookId, parentChapterId: two, title: "Üç", content: "{}", status: "draft" });

    expect(await owner.t.query(api.chapters.continuationCount, { chapterId: two })).toBe(1);
    const other = await signInAsNewUser(t, authApi);
    expect(await other.t.query(api.chapters.continuationCount, { chapterId: two })).toBeNull();
    await expect(other.t.mutation(api.chapters.removeWithContinuations, { chapterId: two })).rejects.toThrow();

    const result = await owner.t.mutation(api.chapters.removeWithContinuations, { chapterId: two });
    expect(result).toEqual({ parentChapterId: chapterId, deleted: 2 });
    const left = await t.run((ctx) => ctx.db.query("chapters").collect());
    expect(left.map((c) => c._id)).toEqual([chapterId]);
    const book = await t.run((ctx) => ctx.db.get(bookId));
    expect(book?.chapterCount).toBe(1);
  });
});

describe("drafts", () => {
  test("the desk lists the writer's drafts, not their published chapters", async () => {
    const { t, authApi } = setupTest(modules);
    const { owner, bookId, chapterId } = await bookWithChapter(t, authApi);
    const draft = await owner.t.mutation(api.chapters.create, { bookId, parentChapterId: chapterId, title: "Taslak", content: "{}", status: "draft" });
    const drafts = await owner.t.query(api.chapters.myDrafts, {});
    expect(drafts.map((d) => d._id)).toEqual([draft]);
    expect(drafts[0].bookTitle).toBe("Kitap");
    await owner.t.mutation(api.chapters.update, { chapterId: draft, status: "published" });
    expect(await owner.t.query(api.chapters.myDrafts, {})).toEqual([]);
  });
});

describe("deleting an account", () => {
  test("needs the username; then the account, its writings and its world are gone", async () => {
    const { t, authApi } = setupTest(modules);
    const { owner, bookId, chapterId } = await bookWithChapter(t, authApi);
    await t.run(async (ctx) => {
      await ctx.runMutation(components.authUsername.public.setUsername, { userId: owner.userId, username: "ada" });
    });
    await owner.t.mutation(api.entities.create, { kind: "character", name: "Kahraman" });

    // Comments on someone else's writing: ours go, theirs stay.
    const friend = await signInAsNewUser(t, authApi);
    const otherBook = await friend.t.mutation(api.books.create, { title: "Ortak", visibility: "public" });
    const root = await friend.t.mutation(api.chapters.create, { bookId: otherBook, title: "Kök", content: "{}", status: "published" });
    const reader = await signInAsNewUser(t, authApi);
    await reader.t.mutation(api.social.addComment, { targetType: "chapter", targetId: root, content: "x" });
    await owner.t.mutation(api.social.addComment, { targetType: "chapter", targetId: root, content: "benim yorumum" });

    // The username must be typed again (the password check runs in the
    // auth component, whose hashing doesn't load under the test runner).
    await expect(owner.t.mutation(api.users.deleteAccount, { username: "bob", password: "uzun-bir-sifre-42" })).rejects.toThrow(
      "Kullanıcı adın eşleşmiyor.",
    );

    await t.mutation(internal.users.erase, { userId: owner.userId });
    await t.finishAllScheduledFunctions(() => {});

    const state = await t.run(async (ctx) => ({
      user: await ctx.db.get(owner.userId),
      book: await ctx.db.get(bookId),
      chapter: await ctx.db.get(chapterId),
      entities: await ctx.db.query("entities").collect(),
      comments: await ctx.db.query("comments").collect(),
      username: await ctx.runQuery(components.authUsername.public.getUsername, { userId: owner.userId }),
    }));
    expect(state.user?.deletedAt).toBeTypeOf("number");
    expect(state.book).toBeNull();
    expect(state.chapter).toBeNull();
    expect(state.entities).toHaveLength(0);
    expect(state.comments.map((c) => c.content)).toEqual(["x"]);
    expect(state.username).toBeNull();
    expect(await owner.t.query(api.users.publicProfile, { userId: owner.userId })).toBeNull();
  });
});

describe("relations web", () => {
  test("a character's web has its family and the rest; a love returned reads both ways", async () => {
    const { t, authApi } = setupTest(modules);
    const writer = await signInAsNewUser(t, authApi);
    const make = (name: string) => writer.t.mutation(api.entities.create, { kind: "character", name });
    const [ada, bora, cem, deniz] = [await make("Ada"), await make("Bora"), await make("Cem"), await make("Deniz")];
    await writer.t.mutation(api.entities.setLinks, { entityId: ada, role: "loves", toIds: [bora] });
    await writer.t.mutation(api.entities.setLinks, { entityId: bora, role: "loves", toIds: [ada] });
    await writer.t.mutation(api.entities.setLinks, { entityId: ada, role: "enemies", toIds: [cem] });
    await writer.t.mutation(api.entities.setLinks, { entityId: deniz, role: "mother", toIds: [ada] });

    const web = await writer.t.query(api.family.web, { entityId: ada });
    expect(web?.nodes.map((n) => n.name).sort()).toEqual(["Ada", "Bora", "Cem", "Deniz"]);
    expect(web?.edges.map((e) => e.role).sort()).toEqual(["enemies", "loves", "loves", "mother"]);

    // A reader sees nothing without a writing that shows these characters.
    const reader = await signInAsNewUser(t, authApi);
    expect(await reader.t.query(api.family.web, { entityId: ada })).toBeNull();
    // The whole cast, for the writer.
    expect((await writer.t.query(api.family.web, {}))?.edges).toHaveLength(4);
  });
});

describe("publishing a draft", () => {
  test("in a private writing the owner can open the writing too; a co-writer cannot", async () => {
    const { t, authApi } = setupTest(modules);
    const owner = await signInAsNewUser(t, authApi);
    const bookId = await owner.t.mutation(api.books.create, { title: "Gizli", visibility: "private" });
    const chapterId = await owner.t.mutation(api.chapters.create, { bookId, title: "Bir", content: "{}", status: "draft" });
    const drafts = await owner.t.query(api.chapters.myDrafts, {});
    expect(drafts[0]).toMatchObject({ bookPrivate: true, ownsBook: true, hasContinuations: false });

    const other = await signInAsNewUser(t, authApi);
    await expect(other.t.mutation(api.chapters.publishDraft, { chapterId, openBook: true })).rejects.toThrow();

    await owner.t.mutation(api.chapters.publishDraft, { chapterId, openBook: true });
    const state = await t.run(async (ctx) => ({ book: await ctx.db.get(bookId), chapter: await ctx.db.get(chapterId) }));
    expect(state.book?.visibility).toBe("public");
    expect(state.chapter?.status).toBe("published");
  });
});

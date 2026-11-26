/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

async function writingWithChapter(
  visibility: "public" | "private",
  t: ReturnType<typeof setupTest>["t"],
  authApi: ReturnType<typeof setupTest>["authApi"],
) {
  const { t: asOwner, userId: ownerId } = await signInAsNewUser(t, authApi);
  const bookId = await asOwner.mutation(api.books.create, {
    title: "Günlüğüm",
    kind: "diary",
    visibility,
  });
  const chapterId = await asOwner.mutation(api.chapters.create, {
    bookId,
    title: "Salı",
    content: "{}",
    status: "published",
  });
  return { asOwner, ownerId, bookId, chapterId };
}

describe("private writings stay private", () => {
  test("a published page of a private diary is hidden from everyone but its owner", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId, chapterId } = await writingWithChapter("private", t, authApi);
    const characterId = await asOwner.mutation(api.entities.create, {
      kind: "character",
      name: "Annem",
      bookId,
    });
    await asOwner.mutation(api.social.addComment, {
      targetType: "chapter",
      targetId: chapterId,
      content: "kendime not",
    });
    const { t: asStranger } = await signInAsNewUser(t, authApi);
    const page = { paginationOpts: { numItems: 10, cursor: null } };

    for (const viewer of [t, asStranger]) {
      expect(await viewer.query(api.chapters.get, { chapterId })).toBeNull();
      expect(await viewer.query(api.chapters.getTree, { bookId })).toEqual([]);
      expect(await viewer.query(api.chapters.listChildren, { bookId })).toEqual([]);
      expect(await viewer.query(api.entities.listForBook, { bookId })).toEqual([]);
      const comments = await viewer.query(api.social.listComments, {
        targetType: "chapter",
        targetId: chapterId,
        ...page,
      });
      expect(comments.page).toEqual([]);
    }
    await expect(
      asStranger.mutation(api.reading.markChapterRead, { chapterId }),
    ).rejects.toThrow();

    expect(await asOwner.query(api.chapters.get, { chapterId })).not.toBeNull();
    expect(await asOwner.query(api.chapters.getTree, { bookId })).toHaveLength(1);
    expect(
      (await asOwner.query(api.entities.listForBook, { bookId })).map((c) => c._id),
    ).toEqual([characterId]);
  });

  test("a public writing is readable without an account", async () => {
    const { t, authApi } = setupTest(modules);
    const { bookId, chapterId } = await writingWithChapter("public", t, authApi);

    expect(await t.query(api.chapters.get, { chapterId })).not.toBeNull();
    expect(await t.query(api.chapters.getTree, { bookId })).toHaveLength(1);
  });

  test("turning a writing private hides it again", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId, chapterId } = await writingWithChapter("public", t, authApi);

    await asOwner.mutation(api.books.update, { bookId, visibility: "private" });

    expect(await t.query(api.chapters.get, { chapterId })).toBeNull();
  });
});

describe("author notes", () => {
  const withNote = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Selin " },
          {
            type: "text",
            text: "limana",
            marks: [{ type: "bold" }, { type: "authorNote", attrs: { note: "gizli plan" } }],
          },
        ],
      },
    ],
  });

  test("only the author receives their notes; readers get the plain text", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Roman",
      visibility: "public",
    });
    const chapterId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Bir",
      content: withNote,
      status: "published",
    });

    const own = await asOwner.query(api.chapters.get, { chapterId });
    expect(own?.content).toContain("gizli plan");

    const reader = await t.query(api.chapters.get, { chapterId });
    expect(reader?.content).not.toContain("gizli plan");
    expect(reader?.content).not.toContain("authorNote");
    expect(reader?.content).toContain("limana");
    expect(reader?.content).toContain('"bold"');

    const tree = await t.query(api.chapters.getTree, { bookId });
    expect(tree[0].content).not.toContain("gizli plan");
  });

  test("nobody can add an entity to someone else's writing", async () => {
    const { t, authApi } = setupTest(modules);
    const { bookId } = await writingWithChapter("public", t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);

    await expect(
      asStranger.mutation(api.entities.create, { kind: "character", name: "Sızma", bookId }),
    ).rejects.toThrow();
    const ownId = await asStranger.mutation(api.entities.create, { kind: "place", name: "Sızma" });
    await expect(
      asStranger.mutation(api.entities.attachToBook, { bookId, entityId: ownId }),
    ).rejects.toThrow();
  });
});

describe("deleting", () => {
  test("a chapter can only be deleted once nothing continues from it", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId, chapterId: rootId } = await writingWithChapter(
      "private",
      t,
      authApi,
    );
    const nextId = await asOwner.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootId,
      title: "Çarşamba",
      content: "{}",
      status: "draft",
    });

    await expect(
      asOwner.mutation(api.chapters.remove, { chapterId: rootId }),
    ).rejects.toThrow(/devamı var/);

    await asOwner.mutation(api.chapters.remove, { chapterId: nextId });
    await asOwner.mutation(api.chapters.remove, { chapterId: rootId });

    expect(await asOwner.query(api.chapters.getTree, { bookId })).toEqual([]);
    expect((await asOwner.query(api.books.get, { bookId }))?.rootChapterId).toBeUndefined();
  });

  test("deleting the main line hands it to the next sibling", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId, chapterId: rootId } = await writingWithChapter(
      "public",
      t,
      authApi,
    );
    const create = (title: string) =>
      asOwner.mutation(api.chapters.create, {
        bookId,
        parentChapterId: rootId,
        title,
        content: "{}",
        status: "published",
      });
    const mainId = await create("Ana");
    const altId = await create("Alternatif");

    await asOwner.mutation(api.chapters.remove, { chapterId: mainId });

    expect((await asOwner.query(api.chapters.get, { chapterId: altId }))?.isCanonical).toBe(
      true,
    );
  });

  test("strangers cannot delete someone else's chapter or writing", async () => {
    const { t, authApi } = setupTest(modules);
    const { bookId, chapterId } = await writingWithChapter("public", t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);

    await expect(asStranger.mutation(api.chapters.remove, { chapterId })).rejects.toThrow();
    await expect(asStranger.mutation(api.books.remove, { bookId })).rejects.toThrow();
  });

  test("deleting a writing removes its chapters, reactions and cast links", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId, chapterId } = await writingWithChapter("public", t, authApi);
    const characterId = await asOwner.mutation(api.entities.create, {
      kind: "character",
      name: "Selin",
      bookId,
    });
    const { t: asReader } = await signInAsNewUser(t, authApi);
    await asReader.mutation(api.social.toggleLike, { targetType: "chapter", targetId: chapterId });
    await asReader.mutation(api.social.addComment, {
      targetType: "book",
      targetId: bookId,
      content: "Güzel",
    });
    await asReader.mutation(api.social.toggleFavorite, { targetType: "book", targetId: bookId });
    await asReader.mutation(api.reading.markChapterRead, { chapterId });

    await asOwner.mutation(api.books.remove, { bookId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const leftovers = await t.run(async (ctx) => ({
      book: await ctx.db.get(bookId),
      chapters: await ctx.db.query("chapters").collect(),
      likes: await ctx.db.query("likes").collect(),
      comments: await ctx.db.query("comments").collect(),
      favorites: await ctx.db.query("favorites").collect(),
      reads: await ctx.db.query("chapterReads").collect(),
      links: await ctx.db.query("bookEntities").collect(),
      character: await ctx.db.get(characterId),
    }));
    expect(leftovers).toMatchObject({
      book: null,
      chapters: [],
      likes: [],
      comments: [],
      favorites: [],
      reads: [],
      links: [],
    });
    // The character belongs to its creator, not the writing; it survives.
    expect(leftovers.character).not.toBeNull();
  });

  test("deleting an entity takes it out of its writings and links", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId } = await writingWithChapter("public", t, authApi);
    const fatherId = await asOwner.mutation(api.entities.create, {
      kind: "character",
      name: "Aras",
      bookId,
    });
    const childId = await asOwner.mutation(api.entities.create, {
      kind: "character",
      name: "Selin",
      bookId,
    });
    await asOwner.mutation(api.entities.setLinks, { entityId: childId, role: "father", toIds: [fatherId] });
    await asOwner.mutation(api.social.toggleFavorite, { targetType: "entity", targetId: fatherId });

    await asOwner.mutation(api.entities.remove, { entityId: fatherId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect((await t.query(api.entities.listForBook, { bookId })).map((e) => e._id)).toEqual([childId]);
    const leftovers = await t.run(async (ctx) => ({
      links: await ctx.db.query("entityLinks").collect(),
      favorites: await ctx.db.query("favorites").collect(),
    }));
    expect(leftovers).toEqual({ links: [], favorites: [] });
    const child = await asOwner.query(api.entities.get, { entityId: childId });
    expect(child?.links.father).toEqual([]);
  });
});

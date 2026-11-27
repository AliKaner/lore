/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api, components } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

const doc = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });

async function team() {
  const { t, authApi } = setupTest(modules);
  const owner = await signInAsNewUser(t, authApi);
  const ada = await signInAsNewUser(t, authApi);
  const stranger = await signInAsNewUser(t, authApi);
  await t.run(async (ctx) => {
    await ctx.runMutation(components.authUsername.public.setUsername, { userId: ada.userId, username: "ada" });
  });
  const bookId = await owner.t.mutation(api.books.create, { title: "Kuzey", visibility: "private" });
  const rootId = await owner.t.mutation(api.chapters.create, {
    bookId,
    title: "Sis",
    content: doc("Selin kapıyı açtı."),
    status: "published",
  });
  return { t, owner, ada, stranger, bookId, rootId };
}

describe("co-authors", () => {
  test("a co-author sees the private writing and writes in it; a stranger doesn't", async () => {
    const { owner, ada, stranger, bookId, rootId } = await team();
    expect(await ada.t.query(api.books.get, { bookId })).toBeNull();
    await owner.t.mutation(api.members.add, { bookId, username: "@ada" });
    expect((await ada.t.query(api.books.get, { bookId }))?.title).toBe("Kuzey");
    expect(await ada.t.query(api.members.myRole, { bookId })).toBe("coauthor");
    const next = await ada.t.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootId,
      title: "Liman",
      content: doc("Ada yazdı."),
      status: "published",
    });
    expect(next).toBeTruthy();
    expect(await stranger.t.query(api.books.get, { bookId })).toBeNull();
    await expect(
      stranger.t.mutation(api.chapters.create, { bookId, parentChapterId: rootId, title: "X", content: doc("x"), status: "draft" }),
    ).rejects.toThrow();
    await expect(stranger.t.mutation(api.members.add, { bookId, username: "ada" })).rejects.toThrow();
    const shared = await ada.t.query(api.members.sharedWithMe, {});
    expect(shared.map((b) => b._id)).toEqual([bookId]);

    // Leaving takes the access away again.
    await ada.t.mutation(api.members.remove, { bookId, userId: ada.userId });
    expect(await ada.t.query(api.books.get, { bookId })).toBeNull();
  });

  test("a suggestion is merged by the author and the old text kept", async () => {
    const { owner, ada, stranger, bookId, rootId } = await team();
    await owner.t.mutation(api.members.add, { bookId, username: "ada" });
    await expect(
      stranger.t.mutation(api.proposals.create, { chapterId: rootId, title: "Sis", content: doc("x") }),
    ).rejects.toThrow();
    const proposalId = await ada.t.mutation(api.proposals.create, {
      chapterId: rootId,
      title: "Sis",
      content: doc("Selin sessizce kapıyı açtı."),
      note: "Daha sessiz olsun",
    });
    const seen = await owner.t.query(api.proposals.listForChapter, { chapterId: rootId });
    expect(seen?.canDecide).toBe(true);
    expect(seen?.proposals.map((p) => p.proposerName)).toEqual(["ada"]);
    await expect(ada.t.mutation(api.proposals.merge, { proposalId })).rejects.toThrow();
    await owner.t.mutation(api.proposals.merge, { proposalId });
    const chapter = await owner.t.query(api.chapters.get, { chapterId: rootId });
    expect(chapter?.content).toContain("sessizce");
    const versions = await owner.t.query(api.versions.list, { chapterId: rootId });
    const kept = await owner.t.query(api.versions.get, { versionId: versions[0]._id });
    expect(kept?.content).toContain("Selin kapıyı açtı.");
    expect((await owner.t.query(api.proposals.listForChapter, { chapterId: rootId }))?.proposals).toHaveLength(0);
  });

  test("the corkboard is shared by the authors only", async () => {
    const { owner, ada, stranger, bookId, rootId } = await team();
    await owner.t.mutation(api.members.add, { bookId, username: "ada" });
    const a = await owner.t.mutation(api.planCards.create, { bookId, title: "Açılış" });
    const b = await ada.t.mutation(api.planCards.create, { bookId, title: "Fırtına", chapterId: rootId });
    await ada.t.mutation(api.planCards.move, { cardId: b, beforeId: a });
    const cards = await owner.t.query(api.planCards.list, { bookId });
    expect(cards?.map((c) => c.title)).toEqual(["Fırtına", "Açılış"]);
    expect(cards?.[0].chapter?.title).toBe("Sis");
    expect(await stranger.t.query(api.planCards.list, { bookId })).toBeNull();
    await expect(stranger.t.mutation(api.planCards.create, { bookId, title: "x" })).rejects.toThrow();
  });
});

describe("timeline", () => {
  test("events sort by year, list participants and stay private", async () => {
    const { owner, stranger, bookId } = await team();
    const selin = await owner.t.mutation(api.entities.create, { kind: "character", name: "Selin", bookId });
    await owner.t.mutation(api.entities.update, { entityId: selin, fields: { birthYear: "300" } });
    await owner.t.mutation(api.events.create, { title: "Savaş", year: 318, entityIds: [selin] });
    await owner.t.mutation(api.events.create, { title: "Doğum", year: 300, entityIds: [selin] });
    await owner.t.mutation(api.events.create, { title: "Tarihsiz söylenti" });
    const list = await owner.t.query(api.events.list, {});
    expect(list.map((e) => e.title)).toEqual(["Doğum", "Savaş", "Tarihsiz söylenti"]);
    expect(list[1].entities[0]).toMatchObject({ name: "Selin", birthYear: "300" });
    expect((await owner.t.query(api.events.list, { entityId: selin })).length).toBe(2);
    expect(await stranger.t.query(api.events.list, {})).toEqual([]);
    const other = await stranger.t.mutation(api.entities.create, { kind: "character", name: "Yabancı" });
    await expect(owner.t.mutation(api.events.create, { title: "x", entityIds: [other] })).rejects.toThrow();
  });
});

describe("family tree", () => {
  test("parents, spouse and children by generation", async () => {
    const { owner, stranger } = await team();
    const make = (name: string) => owner.t.mutation(api.entities.create, { kind: "character", name });
    const [selin, aras, leyla, deniz, can] = await Promise.all(["Selin", "Aras", "Leyla", "Deniz", "Can"].map(make));
    await owner.t.mutation(api.entities.setLinks, { entityId: selin, role: "father", toIds: [aras] });
    await owner.t.mutation(api.entities.setLinks, { entityId: selin, role: "mother", toIds: [leyla] });
    await owner.t.mutation(api.entities.setLinks, { entityId: selin, role: "spouse", toIds: [deniz] });
    await owner.t.mutation(api.entities.setLinks, { entityId: can, role: "mother", toIds: [selin] });
    const tree = await owner.t.query(api.family.tree, { entityId: selin });
    const gen = Object.fromEntries(tree!.people.map((p) => [p.name, p.gen]));
    expect(gen).toEqual({ Selin: 0, Aras: -1, Leyla: -1, Deniz: 0, Can: 1 });
    expect(tree!.parentOf).toHaveLength(3);
    expect(tree!.spouses).toHaveLength(1);
    expect(await stranger.t.query(api.family.tree, { entityId: selin })).toBeNull();
  });
});

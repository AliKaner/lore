/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";
import { MAX_VERSIONS, SNAPSHOT_GAP_MS } from "./versions";

const modules = import.meta.glob("./**/*.ts");

const doc = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-25T10:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

async function chapterOf(t: ReturnType<typeof setupTest>["t"], authApi: ReturnType<typeof setupTest>["authApi"]) {
  const { t: asOwner } = await signInAsNewUser(t, authApi);
  const bookId = await asOwner.mutation(api.books.create, { title: "Roman", visibility: "private" });
  const chapterId = await asOwner.mutation(api.chapters.create, {
    bookId,
    title: "Bir",
    content: doc("ilk hali"),
    status: "draft",
  });
  return { asOwner, bookId, chapterId };
}

describe("version history", () => {
  test("an edit keeps the previous text, at most once per gap; publishing always does", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, chapterId } = await chapterOf(t, authApi);

    await asOwner.mutation(api.chapters.update, { chapterId, content: doc("ikinci hali") });
    await asOwner.mutation(api.chapters.update, { chapterId, content: doc("üçüncü hali") });
    let versions = await asOwner.query(api.versions.list, { chapterId });
    expect(versions).toHaveLength(1);
    const first = await asOwner.query(api.versions.get, { versionId: versions[0]._id });
    expect(first?.content).toContain("ilk hali");
    expect(first?.words).toBe(2);

    vi.setSystemTime(Date.now() + SNAPSHOT_GAP_MS + 1000);
    await asOwner.mutation(api.chapters.update, { chapterId, content: doc("dördüncü hali") });
    versions = await asOwner.query(api.versions.list, { chapterId });
    expect(versions).toHaveLength(2);

    await asOwner.mutation(api.chapters.update, {
      chapterId,
      content: doc("yayındaki hali"),
      status: "published",
    });
    versions = await asOwner.query(api.versions.list, { chapterId });
    expect(versions).toHaveLength(3);
    expect(versions[0].reason).toBe("publish");
  });

  test("changing only the status keeps no version", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, chapterId } = await chapterOf(t, authApi);
    await asOwner.mutation(api.chapters.update, { chapterId, status: "published" });
    expect(await asOwner.query(api.versions.list, { chapterId })).toEqual([]);
  });

  test("only the author can see versions", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, chapterId } = await chapterOf(t, authApi);
    await asOwner.mutation(api.chapters.update, { chapterId, content: doc("yeni") });
    const [version] = await asOwner.query(api.versions.list, { chapterId });
    const { t: asStranger } = await signInAsNewUser(t, authApi);

    expect(await asStranger.query(api.versions.list, { chapterId })).toEqual([]);
    expect(await asStranger.query(api.versions.get, { versionId: version._id })).toBeNull();
    expect(await t.query(api.versions.get, { versionId: version._id })).toBeNull();
  });

  test(`no more than ${MAX_VERSIONS} versions are kept`, async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, chapterId } = await chapterOf(t, authApi);
    for (let i = 0; i < MAX_VERSIONS + 8; i++) {
      vi.setSystemTime(Date.now() + 1000);
      await asOwner.mutation(api.chapters.update, {
        chapterId,
        content: doc(`hal ${i}`),
        status: "published",
      });
    }
    const stored = await t.run((ctx) => ctx.db.query("chapterVersions").collect());
    expect(stored).toHaveLength(MAX_VERSIONS);
  });

  test("deleting a chapter removes its versions", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, chapterId } = await chapterOf(t, authApi);
    await asOwner.mutation(api.chapters.update, { chapterId, content: doc("yeni") });

    await asOwner.mutation(api.chapters.remove, { chapterId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(await t.run((ctx) => ctx.db.query("chapterVersions").collect())).toEqual([]);
  });
});

describe("export", () => {
  test("gives the owner every chapter in reading order, main line first", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId, chapterId: rootId } = await chapterOf(t, authApi);
    const add = (title: string, parentChapterId = rootId) =>
      asOwner.mutation(api.chapters.create, {
        bookId,
        parentChapterId,
        title,
        content: doc(title),
        status: "published",
      });
    const mainId = await add("Ana");
    await add("Alternatif");
    await add("Ananın devamı", mainId);

    const exported = await asOwner.query(api.exports.bookForExport, { bookId });
    expect(exported?.book.title).toBe("Roman");
    expect(exported?.chapters.map((c) => [c.title, c.depth, c.onMainLine])).toEqual([
      ["Bir", 0, true],
      ["Ana", 1, true],
      ["Ananın devamı", 2, true],
      ["Alternatif", 1, false],
    ]);
  });

  test("nobody else can export a writing, even a public one", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId } = await chapterOf(t, authApi);
    await asOwner.mutation(api.books.update, { bookId, visibility: "public" });
    const { t: asStranger } = await signInAsNewUser(t, authApi);

    expect(await asStranger.query(api.exports.bookForExport, { bookId })).toBeNull();
    expect(await t.query(api.exports.bookForExport, { bookId })).toBeNull();
  });
});

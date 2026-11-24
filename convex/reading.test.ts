/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

async function createPublicBookWithChapter(
  t: ReturnType<typeof setupTest>["t"],
  authApi: ReturnType<typeof setupTest>["authApi"],
  title = "Bölüm",
) {
  const { t: asOwner } = await signInAsNewUser(t, authApi);
  const bookId = await asOwner.mutation(api.books.create, {
    title: "Kitap",
    visibility: "public",
  });
  const chapterId = await asOwner.mutation(api.chapters.create, {
    bookId,
    title,
    content: "{}",
    status: "published",
  });
  return { bookId, chapterId };
}

describe("reading progress", () => {
  test("marking a chapter read is idempotent and grants XP once", async () => {
    const { t, authApi } = setupTest(modules);
    const { chapterId } = await createPublicBookWithChapter(t, authApi);
    const { t: asReader } = await signInAsNewUser(t, authApi);

    await asReader.mutation(api.reading.markChapterRead, { chapterId });
    await asReader.mutation(api.reading.markChapterRead, { chapterId });

    const me = await asReader.query(api.users.me);
    expect(me?.xp).toBe(10);

    const library = await asReader.query(api.reading.myLibrary);
    expect(library[0]?.chaptersRead).toBe(1);
  });

  test("level increases once XP crosses the next 100-point threshold", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asReader, userId } = await signInAsNewUser(t, authApi);

    for (let i = 0; i < 10; i++) {
      const { chapterId } = await createPublicBookWithChapter(
        t,
        authApi,
        `Bölüm ${i}`,
      );
      await asReader.mutation(api.reading.markChapterRead, { chapterId });
    }

    const me = await asReader.query(api.users.me);
    expect(me?.xp).toBe(100);
    expect(me?.level).toBe(2);
  });

  test("the library groups read chapters by book", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Kitap",
      visibility: "public",
    });
    const rootId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Bölüm 1",
      content: "{}",
      status: "published",
    });
    const secondId = await asOwner.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootId,
      title: "Bölüm 2",
      content: "{}",
      status: "published",
    });

    const { t: asReader } = await signInAsNewUser(t, authApi);
    await asReader.mutation(api.reading.markChapterRead, { chapterId: rootId });
    await asReader.mutation(api.reading.markChapterRead, { chapterId: secondId });

    const library = await asReader.query(api.reading.myLibrary);
    expect(library).toHaveLength(1);
    expect(library[0]?.book._id).toBe(bookId);
    expect(library[0]?.chaptersRead).toBe(2);
  });
});

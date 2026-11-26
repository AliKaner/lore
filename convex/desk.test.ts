/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

const doc = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-26T09:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("the writer's desk", () => {
  test("words, chapter count and the last edit follow the owner's chapters", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, { title: "Roman", visibility: "private" });

    const first = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Bir",
      content: doc("üç kelime burada"),
      status: "draft",
    });
    let book = await asOwner.query(api.books.get, { bookId });
    expect(book).toMatchObject({ wordCount: 3, chapterCount: 1, lastEditedChapterId: first });

    vi.setSystemTime(Date.now() + 60_000);
    const second = await asOwner.mutation(api.chapters.create, {
      bookId,
      parentChapterId: first,
      title: "İki",
      content: doc("iki kelime"),
      status: "draft",
    });
    await asOwner.mutation(api.chapters.update, { chapterId: first, content: doc("artık dört kelime var") });
    book = await asOwner.query(api.books.get, { bookId });
    expect(book).toMatchObject({ wordCount: 6, chapterCount: 2, lastEditedChapterId: first });

    await asOwner.mutation(api.chapters.remove, { chapterId: second });
    book = await asOwner.query(api.books.get, { bookId });
    expect(book).toMatchObject({ wordCount: 4, chapterCount: 1 });
  });

  test("a reader's branch doesn't move the owner's desk", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Şiirler",
      kind: "poetry",
      visibility: "public",
    });
    const root = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Gazel",
      content: doc("bir iki"),
      status: "published",
    });
    const { t: asReader } = await signInAsNewUser(t, authApi);
    await asReader.mutation(api.chapters.create, {
      bookId,
      parentChapterId: root,
      title: "Nazire",
      content: doc("çok uzun bir nazire metni"),
      status: "published",
    });

    const book = await asOwner.query(api.books.get, { bookId });
    expect(book).toMatchObject({ wordCount: 2, chapterCount: 1, lastEditedChapterId: root });
  });

  test("the desk lists the most recently worked-on writing first", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const older = await asOwner.mutation(api.books.create, { title: "Eski", visibility: "private" });
    const newer = await asOwner.mutation(api.books.create, { title: "Yeni", visibility: "private" });
    const olderChapter = await asOwner.mutation(api.chapters.create, {
      bookId: older,
      title: "Bölüm",
      content: doc("metin"),
      status: "draft",
    });
    vi.setSystemTime(Date.now() + 60_000);
    await asOwner.mutation(api.chapters.create, {
      bookId: newer,
      title: "Bölüm",
      content: doc("metin"),
      status: "draft",
    });
    vi.setSystemTime(Date.now() + 60_000);
    const empty = await asOwner.mutation(api.books.create, { title: "Boş", visibility: "private" });
    vi.setSystemTime(Date.now() + 60_000);
    await asOwner.mutation(api.chapters.update, { chapterId: olderChapter, content: doc("yeniden") });

    const desk = await asOwner.query(api.books.myDesk, {});
    expect(desk.map((b) => b._id)).toEqual([older, empty, newer]);
    expect(desk[0].lastChapter?.title).toBe("Bölüm");
  });

  test("the backfill fills in numbers for older writings", async () => {
    const { t, authApi } = setupTest(modules);
    const { userId } = await signInAsNewUser(t, authApi);
    const bookId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("books", {
        title: "Eski kitap",
        ownerId: userId,
        kind: "book",
        visibility: "private",
        likeCount: 0,
        shareCount: 0,
        createdAt: 0,
      });
      await ctx.db.insert("chapters", {
        bookId: id,
        authorId: userId,
        title: "Bir",
        content: doc("dört kelimelik eski metin"),
        order: 0,
        isCanonical: true,
        status: "published",
        likeCount: 0,
        shareCount: 0,
        createdAt: 5,
      });
      return id;
    });

    await t.mutation(internal.migrations.backfillDeskStats, {});
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const book = await t.run((ctx) => ctx.db.get(bookId));
    expect(book).toMatchObject({ wordCount: 4, chapterCount: 1, lastEditedAt: 5 });
  });
});

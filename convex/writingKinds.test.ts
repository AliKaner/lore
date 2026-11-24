/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

describe("writing kinds", () => {
  test("a new writing is a book unless another kind is given", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);

    const bookId = await asOwner.mutation(api.books.create, {
      title: "Roman",
      visibility: "private",
    });
    const diaryId = await asOwner.mutation(api.books.create, {
      title: "Günlüğüm",
      kind: "diary",
      visibility: "private",
    });

    expect((await asOwner.query(api.books.get, { bookId }))?.kind).toBe("book");
    expect((await asOwner.query(api.books.get, { bookId: diaryId }))?.kind).toBe("diary");
  });

  test("the public listing can be filtered by kind", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);

    const columnId = await asOwner.mutation(api.books.create, {
      title: "Pazartesi yazıları",
      kind: "column",
      visibility: "public",
    });
    const novelId = await asOwner.mutation(api.books.create, {
      title: "Kuzey Limanı",
      kind: "book",
      visibility: "public",
    });

    const columns = await t.query(api.books.listPublic, {
      kind: "column",
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(columns.page.map((b) => b._id)).toEqual([columnId]);

    const everything = await t.query(api.books.listPublic, {
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(everything.page.map((b) => b._id)).toEqual(
      expect.arrayContaining([columnId, novelId]),
    );
  });

  async function publicWritingWithRoot(
    kind: "column" | "poetry",
    t: ReturnType<typeof setupTest>["t"],
    authApi: ReturnType<typeof setupTest>["authApi"],
  ) {
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Herkese açık",
      kind,
      visibility: "public",
    });
    const rootChapterId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "İlk",
      content: "{}",
      status: "published",
    });
    return { asOwner, bookId, rootChapterId };
  }

  test("nobody else can add to a public column, but its author can", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId, rootChapterId } = await publicWritingWithRoot(
      "column",
      t,
      authApi,
    );
    const { t: asStranger } = await signInAsNewUser(t, authApi);

    await expect(
      asStranger.mutation(api.chapters.create, {
        bookId,
        parentChapterId: rootChapterId,
        title: "İzinsiz devam",
        content: "{}",
        status: "published",
      }),
    ).rejects.toThrow();

    await asOwner.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootChapterId,
      title: "İkinci yazı",
      content: "{}",
      status: "published",
    });
  });

  test("readers can answer a public poem with their own (nazire)", async () => {
    const { t, authApi } = setupTest(modules);
    const { bookId, rootChapterId } = await publicWritingWithRoot("poetry", t, authApi);
    const { t: asReader } = await signInAsNewUser(t, authApi);

    const nazireId = await asReader.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootChapterId,
      title: "Nazire",
      content: "{}",
      status: "published",
    });
    expect(nazireId).toBeDefined();
  });

  test("the backfill marks kindless legacy books as books", async () => {
    const { t, authApi } = setupTest(modules);
    const { userId } = await signInAsNewUser(t, authApi);
    const legacyId = await t.run((ctx) =>
      ctx.db.insert("books", {
        title: "Eski kitap",
        ownerId: userId,
        visibility: "public",
        likeCount: 0,
        shareCount: 0,
        createdAt: 0,
      }),
    );

    await t.mutation(internal.migrations.backfillBookKinds, {});

    const legacy = await t.run((ctx) => ctx.db.get(legacyId));
    expect(legacy?.kind).toBe("book");
  });
});

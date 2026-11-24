/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

describe("books", () => {
  test("creating a book requires sign-in", async () => {
    const { t } = setupTest(modules);
    await expect(
      t.mutation(api.books.create, {
        title: "Başlıksız",
        visibility: "public",
      }),
    ).rejects.toThrow();
  });

  test("owner can create and read their own private book", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner, userId } = await signInAsNewUser(t, authApi);

    const bookId = await asOwner.mutation(api.books.create, {
      title: "Gizli Günlük",
      visibility: "private",
    });

    const book = await asOwner.query(api.books.get, { bookId });
    expect(book?.title).toBe("Gizli Günlük");
    expect(book?.ownerId).toBe(userId);
  });

  test("a private book is hidden from other users", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);

    const bookId = await asOwner.mutation(api.books.create, {
      title: "Özel",
      visibility: "private",
    });

    const seenByStranger = await asStranger.query(api.books.get, { bookId });
    expect(seenByStranger).toBeNull();
  });

  test("a public book is listed and visible to everyone", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);

    const bookId = await asOwner.mutation(api.books.create, {
      title: "Herkese Açık",
      visibility: "public",
    });

    const page = await t.query(api.books.listPublic, {
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(page.page.map((b) => b._id)).toContain(bookId);

    const seenByAnonymous = await t.query(api.books.get, { bookId });
    expect(seenByAnonymous?._id).toBe(bookId);
  });

  test("only the owner can update a book", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);

    const bookId = await asOwner.mutation(api.books.create, {
      title: "Taslak",
      visibility: "public",
    });

    await expect(
      asStranger.mutation(api.books.update, {
        bookId,
        title: "Ele Geçirildi",
      }),
    ).rejects.toThrow();

    await asOwner.mutation(api.books.update, { bookId, title: "Düzeltildi" });
    const book = await asOwner.query(api.books.get, { bookId });
    expect(book?.title).toBe("Düzeltildi");
  });
});

// Sanity check that convexTest itself constructs without our auth helper,
// so a future failure in the helper is easy to tell apart from a schema
// problem.
test("schema loads", async () => {
  const { default: schema } = await import("./schema");
  const t = convexTest(schema);
  await t.run(async () => {});
});

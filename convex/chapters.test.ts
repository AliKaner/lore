/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

async function createBook(
  t: Awaited<ReturnType<typeof signInAsNewUser>>["t"],
  visibility: "public" | "private" = "public",
) {
  return await t.mutation(api.books.create, {
    title: "Test Kitabı",
    visibility,
  });
}

describe("chapters - root chapter", () => {
  test("book owner can write the root chapter", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await createBook(asOwner);

    const chapterId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "1. Bölüm",
      content: "{}",
      status: "published",
    });

    const book = await asOwner.query(api.books.get, { bookId });
    expect(book?.rootChapterId).toBe(chapterId);
  });

  test("a stranger cannot write the root chapter, even on a public book", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);
    const bookId = await createBook(asOwner, "public");

    await expect(
      asStranger.mutation(api.chapters.create, {
        bookId,
        title: "Ele geçirilmiş kök",
        content: "{}",
        status: "published",
      }),
    ).rejects.toThrow();
  });
});

describe("chapters - branching (fan-fiction)", () => {
  async function createPublicBookWithRoot(
    t: ReturnType<typeof setupTest>["t"],
    authApi: ReturnType<typeof setupTest>["authApi"],
  ) {
    const { t: asOwner, userId: ownerId } = await signInAsNewUser(t, authApi);
    const bookId = await createBook(asOwner, "public");
    const rootChapterId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Kök",
      content: "{}",
      status: "published",
    });
    return { asOwner, ownerId, bookId, rootChapterId };
  }

  test("anyone can branch off a published chapter of a public book", async () => {
    const { t, authApi } = setupTest(modules);
    const { bookId, rootChapterId } = await createPublicBookWithRoot(
      t,
      authApi,
    );
    const { t: asFan, userId: fanId } = await signInAsNewUser(t, authApi);

    const branchId = await asFan.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootChapterId,
      title: "Fan dalı",
      content: "{}",
      status: "published",
    });

    const branch = await asFan.query(api.chapters.get, { chapterId: branchId });
    expect(branch?.authorId).toBe(fanId);
    expect(branch?.parentChapterId).toBe(rootChapterId);
  });

  test("cannot branch off a draft chapter", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId } = await createPublicBookWithRoot(t, authApi);
    const draftChapterId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Taslak",
      content: "{}",
      status: "draft",
    });
    const { t: asFan } = await signInAsNewUser(t, authApi);

    await expect(
      asFan.mutation(api.chapters.create, {
        bookId,
        parentChapterId: draftChapterId,
        title: "Taslaktan dal",
        content: "{}",
        status: "published",
      }),
    ).rejects.toThrow();
  });

  test("cannot branch on a private book", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await createBook(asOwner, "private");
    const rootChapterId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Kök",
      content: "{}",
      status: "published",
    });
    const { t: asFan } = await signInAsNewUser(t, authApi);

    await expect(
      asFan.mutation(api.chapters.create, {
        bookId,
        parentChapterId: rootChapterId,
        title: "İzinsiz dal",
        content: "{}",
        status: "published",
      }),
    ).rejects.toThrow();
  });

  test("the book owner can branch off their own draft chapter", async () => {
    const { t, authApi } = setupTest(modules);
    const { asOwner, bookId } = await createPublicBookWithRoot(t, authApi);
    const draftChapterId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Taslak",
      content: "{}",
      status: "draft",
    });

    const childId = await asOwner.mutation(api.chapters.create, {
      bookId,
      parentChapterId: draftChapterId,
      title: "Taslağın devamı",
      content: "{}",
      status: "draft",
    });

    expect(childId).toBeDefined();
  });
});

describe("chapters - visibility of drafts", () => {
  test("a draft is hidden from everyone except its author", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await createBook(asOwner, "public");
    const rootId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Kök",
      content: "{}",
      status: "published",
    });
    const draftId = await asOwner.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootId,
      title: "Taslak dal",
      content: "{}",
      status: "draft",
    });

    const { t: asStranger } = await signInAsNewUser(t, authApi);
    const seenByStranger = await asStranger.query(api.chapters.get, {
      chapterId: draftId,
    });
    expect(seenByStranger).toBeNull();

    const childrenForStranger = await asStranger.query(api.chapters.listChildren, {
      bookId,
      parentChapterId: rootId,
    });
    expect(childrenForStranger.map((c) => c._id)).not.toContain(draftId);

    const childrenForOwner = await asOwner.query(api.chapters.listChildren, {
      bookId,
      parentChapterId: rootId,
    });
    expect(childrenForOwner.map((c) => c._id)).toContain(draftId);
  });
});

describe("chapters - editing, canonical branch, moderation", () => {
  test("only the chapter's author can update it", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await createBook(asOwner, "public");
    const rootId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Kök",
      content: "{}",
      status: "published",
    });
    const { t: asFan } = await signInAsNewUser(t, authApi);
    const branchId = await asFan.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootId,
      title: "Fan dalı",
      content: "{}",
      status: "published",
    });

    // The book owner is not the branch's author and cannot edit it.
    await expect(
      asOwner.mutation(api.chapters.update, {
        chapterId: branchId,
        title: "Ele geçirildi",
      }),
    ).rejects.toThrow();

    await asFan.mutation(api.chapters.update, { chapterId: branchId, title: "Düzeltildi" });
    const updated = await asFan.query(api.chapters.get, { chapterId: branchId });
    expect(updated?.title).toBe("Düzeltildi");
  });

  test("only the book owner can mark a branch canonical, and it unsets siblings", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await createBook(asOwner, "public");
    const rootId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Kök",
      content: "{}",
      status: "published",
    });
    const branchAId = await asOwner.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootId,
      title: "Dal A",
      content: "{}",
      status: "published",
    });
    const branchBId = await asOwner.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootId,
      title: "Dal B",
      content: "{}",
      status: "published",
    });

    const { t: asStranger } = await signInAsNewUser(t, authApi);
    await expect(
      asStranger.mutation(api.chapters.markCanonical, { chapterId: branchBId }),
    ).rejects.toThrow();

    await asOwner.mutation(api.chapters.markCanonical, { chapterId: branchBId });
    const a = await asOwner.query(api.chapters.get, { chapterId: branchAId });
    const b = await asOwner.query(api.chapters.get, { chapterId: branchBId });
    expect(a?.isCanonical).toBe(false);
    expect(b?.isCanonical).toBe(true);
  });

  test("only the book owner can hide a reported branch", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await createBook(asOwner, "public");
    const rootId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Kök",
      content: "{}",
      status: "published",
    });
    const { t: asFan } = await signInAsNewUser(t, authApi);
    const branchId = await asFan.mutation(api.chapters.create, {
      bookId,
      parentChapterId: rootId,
      title: "Uygunsuz dal",
      content: "{}",
      status: "published",
    });

    await expect(
      asFan.mutation(api.chapters.hideBranch, { chapterId: branchId }),
    ).rejects.toThrow();

    await asOwner.mutation(api.chapters.hideBranch, { chapterId: branchId });
    const hidden = await asFan.query(api.chapters.get, { chapterId: branchId });
    expect(hidden?.status).toBe("draft");
  });
});

/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

async function createPublicBookWithChapter(
  t: ReturnType<typeof setupTest>["t"],
  authApi: ReturnType<typeof setupTest>["authApi"],
) {
  const { t: asOwner } = await signInAsNewUser(t, authApi);
  const bookId = await asOwner.mutation(api.books.create, {
    title: "Kitap",
    visibility: "public",
  });
  const chapterId = await asOwner.mutation(api.chapters.create, {
    bookId,
    title: "Bölüm",
    content: "{}",
    status: "published",
  });
  return { asOwner, bookId, chapterId };
}

describe("likes", () => {
  test("toggling a like flips state and the chapter's likeCount", async () => {
    const { t, authApi } = setupTest(modules);
    const { chapterId } = await createPublicBookWithChapter(t, authApi);
    const { t: asReader } = await signInAsNewUser(t, authApi);

    const first = await asReader.mutation(api.social.toggleLike, {
      targetType: "chapter",
      targetId: chapterId,
    });
    expect(first.liked).toBe(true);
    let chapter = await t.query(api.chapters.get, { chapterId });
    expect(chapter?.likeCount).toBe(1);
    expect(
      await asReader.query(api.social.hasLiked, {
        targetType: "chapter",
        targetId: chapterId,
      }),
    ).toBe(true);

    const second = await asReader.mutation(api.social.toggleLike, {
      targetType: "chapter",
      targetId: chapterId,
    });
    expect(second.liked).toBe(false);
    chapter = await t.query(api.chapters.get, { chapterId });
    expect(chapter?.likeCount).toBe(0);
  });

  test("liking requires sign-in", async () => {
    const { t, authApi } = setupTest(modules);
    const { chapterId } = await createPublicBookWithChapter(t, authApi);
    await expect(
      t.mutation(api.social.toggleLike, {
        targetType: "chapter",
        targetId: chapterId,
      }),
    ).rejects.toThrow();
  });
});

describe("comments", () => {
  test("a comment appears for everyone, newest first", async () => {
    const { t, authApi } = setupTest(modules);
    const { chapterId } = await createPublicBookWithChapter(t, authApi);
    const { t: asReader } = await signInAsNewUser(t, authApi);

    await asReader.mutation(api.social.addComment, {
      targetType: "chapter",
      targetId: chapterId,
      content: "Harika bir bölüm!",
    });

    const page = await t.query(api.social.listComments, {
      targetType: "chapter",
      targetId: chapterId,
      paginationOpts: { numItems: 10, cursor: null },
    });
    expect(page.page[0]?.content).toBe("Harika bir bölüm!");
  });

  test("an empty comment is rejected", async () => {
    const { t, authApi } = setupTest(modules);
    const { chapterId } = await createPublicBookWithChapter(t, authApi);
    const { t: asReader } = await signInAsNewUser(t, authApi);

    await expect(
      asReader.mutation(api.social.addComment, {
        targetType: "chapter",
        targetId: chapterId,
        content: "   ",
      }),
    ).rejects.toThrow();
  });
});

describe("favorites", () => {
  test("listing favorites while signed out returns an empty list, not an error", async () => {
    const { t } = setupTest(modules);
    const favorites = await t.query(api.social.listMyFavorites, {
      targetType: "book",
    });
    expect(favorites).toEqual([]);
  });

  test("favoriting a character shows up filtered by target type", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asReader } = await signInAsNewUser(t, authApi);
    const characterId = await asReader.mutation(api.characters.create, {
      name: "Elif",
    });

    await asReader.mutation(api.social.toggleFavorite, {
      targetType: "character",
      targetId: characterId,
    });

    const characterFavorites = await asReader.query(api.social.listMyFavorites, {
      targetType: "character",
    });
    expect(characterFavorites.map((f) => f.targetId)).toContain(characterId);

    const bookFavorites = await asReader.query(api.social.listMyFavorites, {
      targetType: "book",
    });
    expect(bookFavorites).toHaveLength(0);
  });

  test("toggling favorite twice removes it", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asReader } = await signInAsNewUser(t, authApi);
    const characterId = await asReader.mutation(api.characters.create, {
      name: "Elif",
    });

    await asReader.mutation(api.social.toggleFavorite, {
      targetType: "character",
      targetId: characterId,
    });
    const result = await asReader.mutation(api.social.toggleFavorite, {
      targetType: "character",
      targetId: characterId,
    });
    expect(result.favorited).toBe(false);

    const favorites = await asReader.query(api.social.listMyFavorites, {
      targetType: "character",
    });
    expect(favorites).toHaveLength(0);
  });
});

describe("shares", () => {
  test("each share increments the counter, unlike a like", async () => {
    const { t, authApi } = setupTest(modules);
    const { chapterId } = await createPublicBookWithChapter(t, authApi);
    const { t: asReader } = await signInAsNewUser(t, authApi);

    await asReader.mutation(api.social.recordShare, {
      targetType: "chapter",
      targetId: chapterId,
    });
    await asReader.mutation(api.social.recordShare, {
      targetType: "chapter",
      targetId: chapterId,
    });

    const chapter = await t.query(api.chapters.get, { chapterId });
    expect(chapter?.shareCount).toBe(2);
  });
});

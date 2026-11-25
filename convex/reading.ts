import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { levelForXp, requireUserId } from "./users";
import type { Id } from "./_generated/dataModel";
import { canViewChapter } from "./access";

const XP_PER_CHAPTER = 10;

export const markChapterRead = mutation({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter || !(await canViewChapter(ctx, chapter, userId))) {
      throw new Error("Bölüm bulunamadı.");
    }

    const existing = await ctx.db
      .query("chapterReads")
      .withIndex("by_user_and_chapter", (q) =>
        q.eq("userId", userId).eq("chapterId", args.chapterId),
      )
      .unique();
    if (existing) return null;

    await ctx.db.insert("chapterReads", {
      userId,
      bookId: chapter.bookId,
      chapterId: args.chapterId,
      createdAt: Date.now(),
    });

    const user = await ctx.db.get(userId);
    if (user) {
      const xp = user.xp + XP_PER_CHAPTER;
      await ctx.db.patch(userId, { xp, level: levelForXp(xp) });
    }
    return null;
  },
});

export const myLibrary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const reads = await ctx.db
      .query("chapterReads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);

    const perBook = new Map<
      Id<"books">,
      { bookId: Id<"books">; count: number; lastReadAt: number }
    >();
    for (const read of reads) {
      const key = read.bookId;
      const entry = perBook.get(key);
      if (entry) {
        entry.count += 1;
        entry.lastReadAt = Math.max(entry.lastReadAt, read.createdAt);
      } else {
        perBook.set(key, { bookId: read.bookId, count: 1, lastReadAt: read.createdAt });
      }
    }

    const results = await Promise.all(
      Array.from(perBook.values()).map(async (entry) => {
        const book = await ctx.db.get(entry.bookId);
        return book
          ? { book, chaptersRead: entry.count, lastReadAt: entry.lastReadAt }
          : null;
      }),
    );
    return results
      .filter((r) => r !== null)
      .sort((a, b) => b!.lastReadAt - a!.lastReadAt);
  },
});

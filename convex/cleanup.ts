import { internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Deleting a writing, chapter, character or place removes the document right
// away; what hangs off it (likes, comments, reads, links…) is swept here in
// bounded batches that reschedule themselves until nothing is left.

const BATCH = 200;

type Sweepable = { _id: Id<"likes" | "comments" | "shares" | "reports" | "favorites" | "chapterReads" | "bookCharacters" | "bookPlaces" | "chapters"> };

async function sweep(ctx: MutationCtx, docs: Sweepable[]) {
  for (const doc of docs) await ctx.db.delete(doc._id);
  return docs.length === BATCH;
}

export const purgeTarget = internalMutation({
  args: {
    targetType: v.union(
      v.literal("book"),
      v.literal("chapter"),
      v.literal("character"),
      v.literal("place"),
    ),
    targetId: v.string(),
  },
  handler: async (ctx, { targetType, targetId }) => {
    let more = false;

    if (targetType === "book" || targetType === "chapter") {
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      const shares = await ctx.db
        .query("shares")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      const reports = await ctx.db
        .query("reports")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      more = (await sweep(ctx, likes)) || more;
      more = (await sweep(ctx, comments)) || more;
      more = (await sweep(ctx, shares)) || more;
      more = (await sweep(ctx, reports)) || more;
    }

    if (targetType !== "chapter") {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      more = (await sweep(ctx, favorites)) || more;
    }

    if (targetType === "chapter") {
      const chapterId = ctx.db.normalizeId("chapters", targetId);
      if (chapterId !== null) {
        const reads = await ctx.db
          .query("chapterReads")
          .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
          .take(BATCH);
        more = (await sweep(ctx, reads)) || more;
      }
    }

    if (targetType === "character") {
      const characterId = ctx.db.normalizeId("characters", targetId);
      if (characterId !== null) {
        const links = await ctx.db
          .query("bookCharacters")
          .withIndex("by_character", (q) => q.eq("characterId", characterId))
          .take(BATCH);
        more = (await sweep(ctx, links)) || more;
      }
    }

    if (targetType === "place") {
      const placeId = ctx.db.normalizeId("places", targetId);
      if (placeId !== null) {
        const links = await ctx.db
          .query("bookPlaces")
          .withIndex("by_place", (q) => q.eq("placeId", placeId))
          .take(BATCH);
        more = (await sweep(ctx, links)) || more;
      }
    }

    if (more) {
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, {
        targetType,
        targetId,
      });
    }
    return null;
  },
});

// Removes every chapter of a deleted book (and schedules each chapter's own
// sweep), plus the book's cast links.
export const purgeBook = internalMutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    for (const chapter of chapters) {
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, {
        targetType: "chapter",
        targetId: chapter._id,
      });
    }
    let more = await sweep(ctx, chapters);

    const characterLinks = await ctx.db
      .query("bookCharacters")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    more = (await sweep(ctx, characterLinks)) || more;

    const placeLinks = await ctx.db
      .query("bookPlaces")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    more = (await sweep(ctx, placeLinks)) || more;

    if (more) {
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeBook, { bookId });
    }
    return null;
  },
});

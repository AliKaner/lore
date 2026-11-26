import { internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Deleting a writing, chapter or entity (character, place…) removes the document right
// away; what hangs off it (likes, comments, reads, links…) is swept here in
// bounded batches that reschedule themselves until nothing is left.

const BATCH = 200;

type Sweepable = {
  _id: Id<
    | "likes"
    | "comments"
    | "shares"
    | "reports"
    | "favorites"
    | "chapterReads"
    | "bookEntities"
    | "entityLinks"
    | "chapters"
    | "chapterVersions"
  >;
};

async function sweep(ctx: MutationCtx, docs: Sweepable[]) {
  for (const doc of docs) await ctx.db.delete(doc._id);
  return docs.length === BATCH;
}

export const purgeTarget = internalMutation({
  args: {
    targetType: v.union(
      v.literal("book"),
      v.literal("chapter"),
      v.literal("entity"),
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
        const versions = await ctx.db
          .query("chapterVersions")
          .withIndex("by_chapter_and_time", (q) => q.eq("chapterId", chapterId))
          .take(BATCH);
        more = (await sweep(ctx, versions)) || more;
      }
    }

    if (targetType === "entity") {
      const entityId = ctx.db.normalizeId("entities", targetId);
      if (entityId !== null) {
        const inBooks = await ctx.db
          .query("bookEntities")
          .withIndex("by_entity", (q) => q.eq("entityId", entityId))
          .take(BATCH);
        const outgoing = await ctx.db
          .query("entityLinks")
          .withIndex("by_from_and_role", (q) => q.eq("fromId", entityId))
          .take(BATCH);
        const incoming = await ctx.db
          .query("entityLinks")
          .withIndex("by_to", (q) => q.eq("toId", entityId))
          .take(BATCH);
        more = (await sweep(ctx, inBooks)) || more;
        more = (await sweep(ctx, outgoing)) || more;
        more = (await sweep(ctx, incoming)) || more;
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
// sweep), plus its links to the writer's entities.
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

    const entityLinks = await ctx.db
      .query("bookEntities")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    more = (await sweep(ctx, entityLinks)) || more;

    if (more) {
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeBook, { bookId });
    }
    return null;
  },
});

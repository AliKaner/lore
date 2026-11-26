import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { wordsIn } from "./versions";

// One-off: fill in the desk numbers (words, chapter count, last edit) for
// writings and chapters created before they were tracked. Run with
// `npx convex run migrations:backfillDeskStats`; it pages through every
// writing and reschedules itself.
export const backfillDeskStats = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("books")
      .paginate({ cursor: args.cursor ?? null, numItems: 20 });
    for (const book of page.page) {
      const chapters = await ctx.db
        .query("chapters")
        .withIndex("by_book", (q) => q.eq("bookId", book._id))
        .take(1000);
      let words = 0;
      let count = 0;
      let last: { id: (typeof chapters)[number]["_id"]; at: number } | null = null;
      for (const chapter of chapters) {
        const chapterWords = chapter.words ?? wordsIn(chapter.content);
        const at = chapter.updatedAt ?? chapter.createdAt;
        if (chapter.words === undefined || chapter.updatedAt === undefined) {
          await ctx.db.patch(chapter._id, { words: chapterWords, updatedAt: at });
        }
        if (chapter.authorId !== book.ownerId) continue;
        words += chapterWords;
        count += 1;
        if (!last || at > last.at) last = { id: chapter._id, at };
      }
      await ctx.db.patch(book._id, {
        wordCount: words,
        chapterCount: count,
        lastEditedAt: last?.at,
        lastEditedChapterId: last?.id,
      });
    }
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillDeskStats, {
        cursor: page.continueCursor,
      });
    }
    return page.page.length;
  },
});

const BATCH_SIZE = 100;

// One-off: books created before writing kinds existed have no `kind`.
// Run with `npx convex run migrations:backfillBookKinds`; it reschedules
// itself until every book has a kind.
export const backfillBookKinds = internalMutation({
  args: {},
  handler: async (ctx) => {
    let patched = 0;
    for (const visibility of ["public", "private"] as const) {
      const legacy = await ctx.db
        .query("books")
        .withIndex("by_visibility_and_kind", (q) =>
          q.eq("visibility", visibility).eq("kind", undefined),
        )
        .take(BATCH_SIZE - patched);
      for (const book of legacy) {
        await ctx.db.patch(book._id, { kind: "book" });
      }
      patched += legacy.length;
      if (patched >= BATCH_SIZE) break;
    }
    if (patched >= BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillBookKinds, {});
    }
    return patched;
  },
});

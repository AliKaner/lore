import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

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

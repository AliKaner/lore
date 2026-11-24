import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./users";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const reportTarget = v.union(v.literal("book"), v.literal("chapter"));

export const create = mutation({
  args: { targetType: reportTarget, targetId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.reason.trim().length === 0) {
      throw new Error("Bir sebep yazmalısın.");
    }
    return await ctx.db.insert("reports", {
      reporterId: userId,
      targetType: args.targetType,
      targetId: args.targetId,
      reason: args.reason.trim(),
      status: "open",
      createdAt: Date.now(),
    });
  },
});

async function belongsToOwnedBook(
  ctx: QueryCtx,
  report: Doc<"reports">,
  myBookIds: Set<Id<"books">>,
): Promise<boolean> {
  if (report.targetType === "book") {
    const bookId = ctx.db.normalizeId("books", report.targetId);
    return bookId !== null && myBookIds.has(bookId);
  }
  const chapterId = ctx.db.normalizeId("chapters", report.targetId);
  if (chapterId === null) return false;
  const chapter = await ctx.db.get(chapterId);
  return chapter !== null && myBookIds.has(chapter.bookId);
}

export const listForMyBooks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const myBooks = await ctx.db
      .query("books")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .take(200);
    const myBookIds = new Set(myBooks.map((b) => b._id));

    const openReports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(200);

    const relevant: Doc<"reports">[] = [];
    for (const report of openReports) {
      if (await belongsToOwnedBook(ctx, report, myBookIds)) {
        relevant.push(report);
      }
    }
    return relevant;
  },
});

export const resolve = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Bildirim bulunamadı.");
    const myBooks = await ctx.db
      .query("books")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .take(200);
    const myBookIds = new Set(myBooks.map((b) => b._id));
    if (!(await belongsToOwnedBook(ctx, report, myBookIds))) {
      throw new Error("Bu bildirimi çözemezsin.");
    }
    await ctx.db.patch(args.reportId, { status: "resolved" });
    return null;
  },
});

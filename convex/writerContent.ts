import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

async function verifyWriterToken(
  ctx: { db: any },
  token: string
): Promise<Id<"writerRequests">> {
  const session = await ctx.db
    .query("writerSessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
  return session.writerRequestId;
}

export const createLoreEntry = mutation({
  args: {
    writerToken: v.string(),
    universeId: v.id("universes"),
    categoryId: v.id("categories"),
    name: v.string(),
    type: v.union(
      v.literal("character"),
      v.literal("city"),
      v.literal("item"),
      v.literal("story"),
      v.literal("other"),
      v.literal("location"),
      v.literal("faction")
    ),
    imageStorageId: v.optional(v.id("_storage")),
    contentTr: v.string(),
    contentEn: v.string(),
  },
  handler: async (ctx, args) => {
    const writerRequestId = await verifyWriterToken(ctx, args.writerToken);
    const { writerToken, ...data } = args;
    return ctx.db.insert("loreEntries", {
      ...data,
      status: "pending",
      submittedByWriterId: writerRequestId,
    });
  },
});

export const createChapter = mutation({
  args: {
    writerToken: v.string(),
    bookId: v.id("books"),
    title: v.string(),
    contentTr: v.string(),
    contentEn: v.string(),
  },
  handler: async (ctx, args) => {
    const writerRequestId = await verifyWriterToken(ctx, args.writerToken);
    const existing = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q: any) => q.eq("bookId", args.bookId))
      .collect();
    const order =
      existing.length > 0 ? Math.max(...existing.map((c: any) => c.order)) + 1 : 0;

    return ctx.db.insert("chapters", {
      bookId: args.bookId,
      title: args.title,
      contentTr: args.contentTr,
      contentEn: args.contentEn,
      order,
      status: "pending",
      submittedByWriterId: writerRequestId,
    });
  },
});

export const myPendingSubmissions = query({
  args: { writerToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("writerSessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.writerToken))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      return { entries: [], chapters: [] };
    }
    const writerRequestId = session.writerRequestId;

    const entries = await ctx.db
      .query("loreEntries")
      .withIndex("by_submittedByWriter", (q: any) =>
        q.eq("submittedByWriterId", writerRequestId)
      )
      .collect();

    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_submittedByWriter", (q: any) =>
        q.eq("submittedByWriterId", writerRequestId)
      )
      .collect();

    return { entries, chapters };
  },
});

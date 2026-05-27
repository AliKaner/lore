import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function verifySession(ctx: { db: any }, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
}

export const list = query({
  handler: async (ctx) => {
    return ctx.db.query("chapters").collect();
  },
});

export const listByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();
    return chapters.sort((a, b) => a.order - b.order);
  },
});

export const getById = query({
  args: { id: v.id("chapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) return null;
    const book = await ctx.db.get(chapter.bookId);
    if (!book) return { ...chapter, book: null, allChapters: [] };
    const allChapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", chapter.bookId))
      .collect();
    const sorted = allChapters.sort((a, b) => a.order - b.order);
    return {
      ...chapter,
      book,
      allChapters: sorted,
      views: chapter.views ?? 0,
      likeCount: chapter.likeCount ?? 0,
    };
  },
});

export const incrementViews = mutation({
  args: { id: v.id("chapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.id);
    if (!chapter) throw new Error("Chapter not found");
    const currentViews = chapter.views ?? 0;
    await ctx.db.patch(args.id, { views: currentViews + 1 });
    return currentViews + 1;
  },
});

export const create = mutation({
  args: {
    bookId: v.id("books"),
    title: v.string(),
    contentTr: v.string(),
    contentEn: v.string(),
    order: v.number(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { sessionToken, ...data } = args;
    return ctx.db.insert("chapters", data);
  },
});

export const update = mutation({
  args: {
    id: v.id("chapters"),
    bookId: v.optional(v.id("books")),
    title: v.optional(v.string()),
    contentTr: v.optional(v.string()),
    contentEn: v.optional(v.string()),
    order: v.optional(v.number()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { id, sessionToken, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("chapters"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
  },
});

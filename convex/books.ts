import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireUserId } from "./users";
import { writingKindValidator } from "./writingKinds";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    kind: v.optional(writingKindValidator),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("books", {
      title: args.title,
      description: args.description,
      ownerId: userId,
      kind: args.kind ?? "book",
      visibility: args.visibility,
      likeCount: 0,
      shareCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) return null;
    if (book.visibility === "public") return book;
    const userId = await requireUserId(ctx).catch(() => null);
    if (userId !== book.ownerId) return null;
    return book;
  },
});

export const listPublic = query({
  args: {
    paginationOpts: paginationOptsValidator,
    kind: v.optional(writingKindValidator),
  },
  handler: async (ctx, args) => {
    const { kind } = args;
    if (kind !== undefined) {
      return await ctx.db
        .query("books")
        .withIndex("by_visibility_and_kind", (q) =>
          q.eq("visibility", "public").eq("kind", kind),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }
    return await ctx.db
      .query("books")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("books")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .take(200);
  },
});

export const update = mutation({
  args: {
    bookId: v.id("books"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Bu kitabı düzenleyemezsin.");
    }
    const { bookId, ...patch } = args;
    await ctx.db.patch(bookId, patch);
    return null;
  },
});

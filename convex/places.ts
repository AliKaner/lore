import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./users";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    originBookId: v.optional(v.id("books")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const placeId = await ctx.db.insert("places", {
      name: args.name,
      description: args.description,
      creatorId: userId,
      originBookId: args.originBookId,
      createdAt: Date.now(),
    });
    if (args.originBookId !== undefined) {
      await ctx.db.insert("bookPlaces", {
        bookId: args.originBookId,
        placeId,
      });
    }
    return placeId;
  },
});

export const get = query({
  args: { placeId: v.id("places") },
  handler: async (ctx, args) => await ctx.db.get(args.placeId),
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("places")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .order("desc")
      .take(200);
  },
});

export const listForBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("bookPlaces")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .take(200);
    const places = await Promise.all(links.map((link) => ctx.db.get(link.placeId)));
    return places.filter((p) => p !== null);
  },
});

export const attachToBook = mutation({
  args: { bookId: v.id("books"), placeId: v.id("places") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Bu kitaba paket ekleyemezsin.");
    }
    const existing = await ctx.db
      .query("bookPlaces")
      .withIndex("by_book_and_place", (q) =>
        q.eq("bookId", args.bookId).eq("placeId", args.placeId),
      )
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("bookPlaces", {
      bookId: args.bookId,
      placeId: args.placeId,
    });
  },
});

export const update = mutation({
  args: {
    placeId: v.id("places"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const place = await ctx.db.get(args.placeId);
    if (!place || place.creatorId !== userId) {
      throw new Error("Bu mekanı düzenleyemezsin.");
    }
    const { placeId, ...patch } = args;
    await ctx.db.patch(placeId, patch);
    return null;
  },
});

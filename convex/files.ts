import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./users";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => await ctx.storage.getUrl(args.storageId),
});

export const setAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ctx.db.patch(userId, { avatarStorageId: args.storageId });
    return null;
  },
});

export const setWallpaper = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ctx.db.patch(userId, { wallpaperStorageId: args.storageId });
    return null;
  },
});

export const setBookCover = mutation({
  args: { bookId: v.id("books"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Bu kitabın kapağını değiştiremezsin.");
    }
    await ctx.db.patch(args.bookId, { coverStorageId: args.storageId });
    return null;
  },
});

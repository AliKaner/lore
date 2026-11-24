import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireUserId } from "./users";
import type { MutationCtx } from "./_generated/server";

const likeableTarget = v.union(v.literal("book"), v.literal("chapter"));
const favoriteTarget = v.union(
  v.literal("book"),
  v.literal("character"),
  v.literal("place"),
);

async function bumpCount(
  ctx: MutationCtx,
  targetType: "book" | "chapter",
  targetId: string,
  field: "likeCount" | "shareCount",
  delta: number,
) {
  const table = targetType === "book" ? "books" : "chapters";
  const id = ctx.db.normalizeId(table, targetId);
  if (id === null) throw new Error("Hedef bulunamadı.");
  const doc = await ctx.db.get(id);
  if (!doc) throw new Error("Hedef bulunamadı.");
  await ctx.db.patch(id, { [field]: doc[field] + delta });
}

export const toggleLike = mutation({
  args: { targetType: likeableTarget, targetId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_and_target", (q) =>
        q
          .eq("userId", userId)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      await bumpCount(ctx, args.targetType, args.targetId, "likeCount", -1);
      return { liked: false };
    }
    await ctx.db.insert("likes", {
      userId,
      targetType: args.targetType,
      targetId: args.targetId,
      createdAt: Date.now(),
    });
    await bumpCount(ctx, args.targetType, args.targetId, "likeCount", 1);
    return { liked: true };
  },
});

export const hasLiked = query({
  args: { targetType: likeableTarget, targetId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx).catch(() => null);
    if (userId === null) return false;
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_and_target", (q) =>
        q
          .eq("userId", userId)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId),
      )
      .unique();
    return existing !== null;
  },
});

export const addComment = mutation({
  args: {
    targetType: likeableTarget,
    targetId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.content.trim().length === 0) {
      throw new Error("Yorum boş olamaz.");
    }
    return await ctx.db.insert("comments", {
      userId,
      targetType: args.targetType,
      targetId: args.targetId,
      content: args.content.trim(),
      createdAt: Date.now(),
    });
  },
});

export const listComments = query({
  args: {
    targetType: likeableTarget,
    targetId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const toggleFavorite = mutation({
  args: { targetType: favoriteTarget, targetId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_target", (q) =>
        q
          .eq("userId", userId)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { favorited: false };
    }
    await ctx.db.insert("favorites", {
      userId,
      targetType: args.targetType,
      targetId: args.targetId,
      createdAt: Date.now(),
    });
    return { favorited: true };
  },
});

export const listMyFavorites = query({
  args: { targetType: v.optional(favoriteTarget) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx).catch(() => null);
    if (userId === null) return [];
    const all = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
    return args.targetType
      ? all.filter((f) => f.targetType === args.targetType)
      : all;
  },
});

export const recordShare = mutation({
  args: { targetType: likeableTarget, targetId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ctx.db.insert("shares", {
      userId,
      targetType: args.targetType,
      targetId: args.targetId,
      createdAt: Date.now(),
    });
    await bumpCount(ctx, args.targetType, args.targetId, "shareCount", 1);
    return null;
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireUserId } from "./users";
import { components } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { canViewChapter, optionalUserId, viewableBook } from "./access";

async function canViewTarget(
  ctx: QueryCtx,
  targetType: "book" | "chapter",
  targetId: string,
  viewerId: Id<"users"> | null,
) {
  if (targetType === "book") {
    const bookId = ctx.db.normalizeId("books", targetId);
    return bookId !== null && (await viewableBook(ctx, bookId, viewerId)) !== null;
  }
  const chapterId = ctx.db.normalizeId("chapters", targetId);
  const chapter = chapterId === null ? null : await ctx.db.get(chapterId);
  return chapter !== null && (await canViewChapter(ctx, chapter, viewerId));
}

const likeableTarget = v.union(v.literal("book"), v.literal("chapter"));
const favoriteTarget = v.union(v.literal("book"), v.literal("entity"));

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
    const userId = await optionalUserId(ctx);
    if (!(await canViewTarget(ctx, args.targetType, args.targetId, userId))) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    const result = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .order("desc")
      .paginate(args.paginationOpts);
    const ownerId = await targetOwner(ctx, args.targetType, args.targetId);
    const names = new Map<Id<"users">, string | null>();
    const page = [];
    for (const comment of result.page) {
      if (!names.has(comment.userId)) {
        names.set(
          comment.userId,
          (await ctx.runQuery(components.authUsername.public.getUsername, { userId: comment.userId })) as string | null,
        );
      }
      page.push({
        ...comment,
        username: names.get(comment.userId) ?? null,
        canDelete: viewerCanDelete(comment.userId, ownerId, userId),
      });
    }
    return { ...result, page };
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

// The writing's owner, for who may remove comments on it.
async function targetOwner(ctx: QueryCtx, targetType: "book" | "chapter", targetId: string) {
  if (targetType === "book") {
    const bookId = ctx.db.normalizeId("books", targetId);
    return bookId ? ((await ctx.db.get(bookId))?.ownerId ?? null) : null;
  }
  const chapterId = ctx.db.normalizeId("chapters", targetId);
  const chapter = chapterId ? await ctx.db.get(chapterId) : null;
  return chapter ? ((await ctx.db.get(chapter.bookId))?.ownerId ?? null) : null;
}

function viewerCanDelete(writerId: Id<"users">, ownerId: Id<"users"> | null, viewerId: Id<"users"> | null) {
  return viewerId !== null && (writerId === viewerId || ownerId === viewerId);
}

// A comment's writer, or the owner of the writing it is on, may remove it.
export const removeComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return null;
    const ownerId = await targetOwner(ctx, comment.targetType, comment.targetId);
    if (!viewerCanDelete(comment.userId, ownerId, userId)) throw new Error("Bu yorumu silemezsin.");
    await ctx.db.delete(comment._id);
    return null;
  },
});

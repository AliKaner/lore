import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserId } from "./users";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

async function assertCanBranch(
  ctx: MutationCtx,
  book: Doc<"books">,
  userId: Id<"users">,
  parentChapterId: Id<"chapters"> | undefined,
) {
  if (book.ownerId === userId) return;
  if (book.visibility !== "public") {
    throw new Error("Bu kitaba dal ekleyemezsin.");
  }
  if (parentChapterId === undefined) {
    throw new Error("Kök bölümü sadece kitabın sahibi yazabilir.");
  }
  const parent = await ctx.db.get(parentChapterId);
  if (!parent || parent.status !== "published") {
    throw new Error("Sadece yayınlanmış bir bölümden kendi dalını açabilirsin.");
  }
}

export const create = mutation({
  args: {
    bookId: v.id("books"),
    parentChapterId: v.optional(v.id("chapters")),
    title: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Kitap bulunamadı.");
    await assertCanBranch(ctx, book, userId, args.parentChapterId);

    const siblings = await ctx.db
      .query("chapters")
      .withIndex("by_book_and_parent", (q) =>
        q.eq("bookId", args.bookId).eq("parentChapterId", args.parentChapterId),
      )
      .collect();

    const chapterId = await ctx.db.insert("chapters", {
      bookId: args.bookId,
      parentChapterId: args.parentChapterId,
      authorId: userId,
      title: args.title,
      content: args.content,
      order: siblings.length,
      isCanonical: siblings.length === 0,
      status: args.status,
      likeCount: 0,
      shareCount: 0,
      createdAt: Date.now(),
    });

    if (args.parentChapterId === undefined && book.rootChapterId === undefined) {
      await ctx.db.patch(args.bookId, { rootChapterId: chapterId });
    }

    return chapterId;
  },
});

export const get = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) return null;
    if (chapter.status === "published") return chapter;
    const userId = await requireUserId(ctx).catch(() => null);
    if (userId !== chapter.authorId) return null;
    return chapter;
  },
});

export const listChildren = query({
  args: { bookId: v.id("books"), parentChapterId: v.optional(v.id("chapters")) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx).catch(() => null);
    const children = await ctx.db
      .query("chapters")
      .withIndex("by_book_and_parent", (q) =>
        q.eq("bookId", args.bookId).eq("parentChapterId", args.parentChapterId),
      )
      .order("asc")
      .take(200);
    return children.filter(
      (c) => c.status === "published" || c.authorId === userId,
    );
  },
});

export const getTree = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx).catch(() => null);
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .take(500);
    return chapters.filter(
      (c) => c.status === "published" || c.authorId === userId,
    );
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("chapters")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .take(200);
  },
});

export const update = mutation({
  args: {
    chapterId: v.id("chapters"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter || chapter.authorId !== userId) {
      throw new Error("Bu bölümü düzenleyemezsin.");
    }
    const { chapterId, ...patch } = args;
    await ctx.db.patch(chapterId, patch);
    return null;
  },
});

export const hideBranch = mutation({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) throw new Error("Bölüm bulunamadı.");
    const book = await ctx.db.get(chapter.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Sadece kitabın sahibi bir dalı gizleyebilir.");
    }
    await ctx.db.patch(args.chapterId, { status: "draft" });
    return null;
  },
});

export const markCanonical = mutation({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) throw new Error("Bölüm bulunamadı.");
    const book = await ctx.db.get(chapter.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Sadece kitabın sahibi resmi hattı seçebilir.");
    }
    const siblings = await ctx.db
      .query("chapters")
      .withIndex("by_book_and_parent", (q) =>
        q.eq("bookId", chapter.bookId).eq("parentChapterId", chapter.parentChapterId),
      )
      .collect();
    for (const sibling of siblings) {
      if (sibling.isCanonical !== (sibling._id === chapter._id)) {
        await ctx.db.patch(sibling._id, {
          isCanonical: sibling._id === chapter._id,
        });
      }
    }
    return null;
  },
});

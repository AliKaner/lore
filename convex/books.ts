import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import { requireUserId } from "./users";
import { isMember } from "./access";
import { bookLanguageValidator, writingKindValidator } from "./writingKinds";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    kind: v.optional(writingKindValidator),
    language: v.optional(bookLanguageValidator),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db.insert("books", {
      title: args.title,
      description: args.description,
      ownerId: userId,
      kind: args.kind ?? "book",
      language: args.language,
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
    if (userId === book.ownerId || (await isMember(ctx, book._id, userId))) return book;
    return null;
  },
});

export const COMMUNITY_BOOK_THRESHOLD = 100;

// Browsing and social features stay hidden until the platform has this many
// writings; until then a book is reached only through a shared link. Only
// writings with at least one chapter count — opening the "new writing" chooser
// creates an empty one, and those shouldn't fill the threshold.
export const communityStatus = query({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_root_chapter", (q) => q.gt("rootChapterId", undefined))
      .take(COMMUNITY_BOOK_THRESHOLD);
    return {
      open: books.length >= COMMUNITY_BOOK_THRESHOLD,
      bookCount: books.length,
      threshold: COMMUNITY_BOOK_THRESHOLD,
    };
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

// The writer's desk: their writings, most recently worked on first, each
// with the chapter to pick up again.
export const myDesk = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const books = await ctx.db
      .query("books")
      .withIndex("by_owner_and_edited", (q) => q.eq("ownerId", userId))
      .order("desc")
      .take(200);
    // Writings never written in (no edit yet) go after the rest, newest first.
    books.sort((a, b) => (b.lastEditedAt ?? b.createdAt) - (a.lastEditedAt ?? a.createdAt));
    return await Promise.all(
      books.map(async (book) => {
        const last = book.lastEditedChapterId ? await ctx.db.get(book.lastEditedChapterId) : null;
        return {
          ...book,
          lastChapter: last ? { _id: last._id, title: last.title, status: last.status } : null,
        };
      }),
    );
  },
});

export const update = mutation({
  args: {
    bookId: v.id("books"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    language: v.optional(bookLanguageValidator),
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

// Deletes a writing with everything in it. Only its owner may, and it cannot
// be undone.
export const remove = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Bu yazıyı silemezsin.");
    }
    if (book.coverStorageId) await ctx.storage.delete(book.coverStorageId);
    await ctx.db.delete(book._id);
    await ctx.scheduler.runAfter(0, internal.cleanup.purgeBook, { bookId: book._id });
    await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, {
      targetType: "book",
      targetId: book._id,
    });
    return null;
  },
});

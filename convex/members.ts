import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireUserId } from "./users";
import { canWriteBook, optionalUserId } from "./access";

// Co-authors: people the owner adds by username. They see the writing even
// when it's private, write chapters in it, plan on its corkboard and suggest
// changes to its chapters. Only the owner adds or removes them; a co-author
// may leave.

const MAX_MEMBERS = 20;

async function usernameOf(ctx: QueryCtx, userId: Id<"users">) {
  return (await ctx.runQuery(components.authUsername.public.getUsername, { userId })) as string | null;
}

export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const viewerId = await optionalUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || !(await canWriteBook(ctx, book, viewerId))) return null;
    const rows = await ctx.db
      .query("bookMembers")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .take(MAX_MEMBERS);
    const owner = { userId: book.ownerId, username: await usernameOf(ctx, book.ownerId), owner: true };
    const members = await Promise.all(
      rows.map(async (row) => ({ userId: row.userId, username: await usernameOf(ctx, row.userId), owner: false })),
    );
    return { people: [owner, ...members], viewerIsOwner: book.ownerId === viewerId };
  },
});

export const add = mutation({
  args: { bookId: v.id("books"), username: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || book.ownerId !== userId) throw new Error("Ortak yazarları yalnızca yazının sahibi ekler.");
    const name = args.username.trim().replace(/^@/u, "");
    if (!name) throw new Error("Bir kullanıcı adı yaz.");
    const memberId = (await ctx.runQuery(components.authUsername.public.getUserIdByUsername, {
      username: name,
    })) as Id<"users"> | null;
    if (memberId === null) throw new Error("Bu kullanıcı adıyla kimse yok.");
    if (memberId === book.ownerId) throw new Error("Sen zaten bu yazının sahibisin.");
    const existing = await ctx.db
      .query("bookMembers")
      .withIndex("by_book_and_user", (q) => q.eq("bookId", book._id).eq("userId", memberId))
      .unique();
    if (existing) return null;
    const count = await ctx.db
      .query("bookMembers")
      .withIndex("by_book", (q) => q.eq("bookId", book._id))
      .take(MAX_MEMBERS);
    if (count.length >= MAX_MEMBERS) throw new Error("Bir yazının en fazla 20 ortak yazarı olabilir.");
    await ctx.db.insert("bookMembers", { bookId: book._id, userId: memberId, addedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { bookId: v.id("books"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const viewerId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Yazı bulunamadı.");
    if (book.ownerId !== viewerId && args.userId !== viewerId) {
      throw new Error("Ortak yazarları yalnızca yazının sahibi çıkarır.");
    }
    const row = await ctx.db
      .query("bookMembers")
      .withIndex("by_book_and_user", (q) => q.eq("bookId", book._id).eq("userId", args.userId))
      .unique();
    if (row) await ctx.db.delete(row._id);
    return null;
  },
});

// Writings someone writes in with others, for their desk.
export const sharedWithMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("bookMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100);
    const books = await Promise.all(rows.map((row) => ctx.db.get(row.bookId)));
    return await Promise.all(
      books
        .filter((b) => b !== null)
        .map(async (book) => ({
          _id: book._id,
          title: book.title,
          kind: book.kind ?? "book",
          rootChapterId: book.rootChapterId ?? null,
          coverStorageId: book.coverStorageId ?? null,
          ownerName: await usernameOf(ctx, book.ownerId),
          lastEditedAt: book.lastEditedAt ?? null,
        })),
    );
  },
});

// The viewer's part in a writing: its owner, a co-author, or neither.
export const myRole = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || userId === null) return null;
    if (book.ownerId === userId) return "owner" as const;
    const row = await ctx.db
      .query("bookMembers")
      .withIndex("by_book_and_user", (q) => q.eq("bookId", book._id).eq("userId", userId))
      .unique();
    return row ? ("coauthor" as const) : null;
  },
});

// Who wrote the chapters of a writing, by user id, for its story map.
export const chapterAuthors = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const viewerId = await optionalUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) return {};
    if (book.visibility !== "public" && !(await canWriteBook(ctx, book, viewerId))) return {};
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .take(500);
    const ids = [...new Set(chapters.map((c) => c.authorId))].slice(0, 100);
    const names: Record<string, string | null> = {};
    for (const id of ids) names[id] = await usernameOf(ctx, id);
    return names;
  },
});

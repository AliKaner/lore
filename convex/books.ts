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

async function getBookStats(ctx: { db: any }, bookId: any) {
  const allChapters = await ctx.db
    .query("chapters")
    .withIndex("by_book", (q: any) => q.eq("bookId", bookId))
    .collect();
  const chapters = allChapters.filter((c: any) => c.status !== "pending");

  let totalWords = 0;
  for (const ch of chapters) {
    const text = ch.contentTr || ch.contentEn || "";
    if (text) {
      totalWords += text.trim().split(/\s+/).filter(Boolean).length;
    }
  }
  
  const totalReadingTime = Math.ceil(totalWords / 80);
  const chapterCount = chapters.length;
  
  return { chapterCount, totalReadingTime };
}

export const list = query({
  handler: async (ctx) => {
    const books = await ctx.db.query("books").collect();
    return Promise.all(
      books.map(async (b) => {
        const stats = await getBookStats(ctx, b._id);
        return {
          ...b,
          ...stats,
          coverUrl: b.coverStorageId
            ? await ctx.storage.getUrl(b.coverStorageId)
            : null,
        };
      })
    );
  },
});

export const listByUniverse = query({
  args: { universeId: v.id("universes") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_universe", (q) => q.eq("universeId", args.universeId))
      .collect();
    return Promise.all(
      books.map(async (b) => {
        const stats = await getBookStats(ctx, b._id);
        return {
          ...b,
          ...stats,
          coverUrl: b.coverStorageId
            ? await ctx.storage.getUrl(b.coverStorageId)
            : null,
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.id);
    if (!book) return null;
    const universe = await ctx.db.get(book.universeId);
    const stats = await getBookStats(ctx, book._id);
    return {
      ...book,
      ...stats,
      coverUrl: book.coverStorageId
        ? await ctx.storage.getUrl(book.coverStorageId)
        : null,
      universe,
    };
  },
});


export const create = mutation({
  args: {
    universeId: v.id("universes"),
    title: v.string(),
    description: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    order: v.optional(v.number()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { sessionToken, ...data } = args;
    return ctx.db.insert("books", data);
  },
});

export const update = mutation({
  args: {
    id: v.id("books"),
    universeId: v.optional(v.id("universes")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
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
  args: { id: v.id("books"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
  },
});

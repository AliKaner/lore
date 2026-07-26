import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function resolveAuthorKey(
  ctx: { db: any },
  args: { sessionToken?: string; writerToken?: string }
): Promise<string> {
  if (args.sessionToken) {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }
    return "admin";
  }

  if (args.writerToken) {
    const session = await ctx.db
      .query("writerSessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.writerToken))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }
    return session.writerRequestId;
  }

  throw new Error("Unauthorized");
}

export const get = query({
  args: {
    bookId: v.id("books"),
    sessionToken: v.optional(v.string()),
    writerToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authorKey = await resolveAuthorKey(ctx, args);
    const note = await ctx.db
      .query("bookNotes")
      .withIndex("by_book_and_author", (q: any) =>
        q.eq("bookId", args.bookId).eq("authorKey", authorKey)
      )
      .first();
    return note?.content ?? "";
  },
});

export const save = mutation({
  args: {
    bookId: v.id("books"),
    content: v.string(),
    sessionToken: v.optional(v.string()),
    writerToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authorKey = await resolveAuthorKey(ctx, args);
    const existing = await ctx.db
      .query("bookNotes")
      .withIndex("by_book_and_author", (q: any) =>
        q.eq("bookId", args.bookId).eq("authorKey", authorKey)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { content: args.content, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("bookNotes", {
        bookId: args.bookId,
        authorKey,
        content: args.content,
        updatedAt: Date.now(),
      });
    }
  },
});

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

export const list = query({
  handler: async (ctx) => {
    const universes = await ctx.db.query("universes").collect();
    return Promise.all(
      universes.map(async (u) => {
        const imageUrl = u.imageStorageId
          ? await ctx.storage.getUrl(u.imageStorageId)
          : null;
        const categories = await ctx.db
          .query("categories")
          .withIndex("by_universe", (q) => q.eq("universeId", u._id))
          .collect();
        const books = await ctx.db
          .query("books")
          .withIndex("by_universe", (q) => q.eq("universeId", u._id))
          .collect();
        const entries = await ctx.db
          .query("loreEntries")
          .withIndex("by_universe", (q) => q.eq("universeId", u._id))
          .collect();

        return {
          ...u,
          imageUrl,
          counts: {
            categories: categories.length,
            books: books.length,
            entries: entries.length,
          },
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("universes") },
  handler: async (ctx, args) => {
    const universe = await ctx.db.get(args.id);
    if (!universe) return null;
    return {
      ...universe,
      imageUrl: universe.imageStorageId
        ? await ctx.storage.getUrl(universe.imageStorageId)
        : null,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    order: v.optional(v.number()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { sessionToken, ...data } = args;
    return ctx.db.insert("universes", data);
  },
});

export const update = mutation({
  args: {
    id: v.id("universes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
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
  args: { id: v.id("universes"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
  },
});

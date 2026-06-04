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
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query("boardGames").collect();
    return Promise.all(
      games.map(async (g) => ({
        ...g,
        coverUrl: g.coverStorageId
          ? await ctx.storage.getUrl(g.coverStorageId)
          : null,
      }))
    );
  },
});

export const listByUniverse = query({
  args: { universeId: v.id("universes") },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query("boardGames")
      .withIndex("by_universe", (q) => q.eq("universeId", args.universeId))
      .collect();
    return Promise.all(
      games.map(async (g) => ({
        ...g,
        coverUrl: g.coverStorageId
          ? await ctx.storage.getUrl(g.coverStorageId)
          : null,
      }))
    );
  },
});

export const getById = query({
  args: { id: v.id("boardGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.id);
    if (!game) return null;
    const universe = await ctx.db.get(game.universeId);
    return {
      ...game,
      coverUrl: game.coverStorageId
        ? await ctx.storage.getUrl(game.coverStorageId)
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
    minPlayers: v.number(),
    maxPlayers: v.number(),
    rulesTr: v.optional(v.string()),
    rulesEn: v.optional(v.string()),
    order: v.optional(v.number()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { sessionToken, ...data } = args;
    return ctx.db.insert("boardGames", data);
  },
});

export const update = mutation({
  args: {
    id: v.id("boardGames"),
    universeId: v.optional(v.id("universes")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    minPlayers: v.optional(v.number()),
    maxPlayers: v.optional(v.number()),
    rulesTr: v.optional(v.string()),
    rulesEn: v.optional(v.string()),
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
  args: { id: v.id("boardGames"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
  },
});

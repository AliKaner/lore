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

export const listByBoardGame = query({
  args: { boardGameId: v.id("boardGames") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("cardTypes")
      .withIndex("by_boardGame", (q) => q.eq("boardGameId", args.boardGameId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("cardTypes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    boardGameId: v.id("boardGames"),
    name: v.string(),
    description: v.optional(v.string()),
    levelCount: v.number(),
    order: v.optional(v.number()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { sessionToken, ...data } = args;
    return ctx.db.insert("cardTypes", data);
  },
});

export const update = mutation({
  args: {
    id: v.id("cardTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    levelCount: v.optional(v.number()),
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
  args: { id: v.id("cardTypes"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
  },
});

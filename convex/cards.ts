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
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_boardGame", (q) => q.eq("boardGameId", args.boardGameId))
      .collect();
    return Promise.all(
      cards.map(async (c) => ({
        ...c,
        imageUrl: c.imageStorageId
          ? await ctx.storage.getUrl(c.imageStorageId)
          : null,
      }))
    );
  },
});

export const listByCardType = query({
  args: { cardTypeId: v.id("cardTypes") },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_cardType", (q) => q.eq("cardTypeId", args.cardTypeId))
      .collect();
    return Promise.all(
      cards.map(async (c) => ({
        ...c,
        imageUrl: c.imageStorageId
          ? await ctx.storage.getUrl(c.imageStorageId)
          : null,
      }))
    );
  },
});

export const listByBoardGameAndCardType = query({
  args: {
    boardGameId: v.id("boardGames"),
    cardTypeId: v.id("cardTypes"),
  },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_boardGame_and_cardType", (q) =>
        q.eq("boardGameId", args.boardGameId).eq("cardTypeId", args.cardTypeId)
      )
      .collect();
    return Promise.all(
      cards.map(async (c) => ({
        ...c,
        imageUrl: c.imageStorageId
          ? await ctx.storage.getUrl(c.imageStorageId)
          : null,
      }))
    );
  },
});

export const getById = query({
  args: { id: v.id("cards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.id);
    if (!card) return null;
    const cardType = await ctx.db.get(card.cardTypeId);
    return {
      ...card,
      imageUrl: card.imageStorageId
        ? await ctx.storage.getUrl(card.imageStorageId)
        : null,
      cardType,
    };
  },
});

export const create = mutation({
  args: {
    boardGameId: v.id("boardGames"),
    cardTypeId: v.id("cardTypes"),
    name: v.string(),
    level: v.number(),
    orientation: v.union(v.literal("vertical"), v.literal("horizontal")),
    imageStorageId: v.optional(v.id("_storage")),
    descriptionTr: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
    order: v.optional(v.number()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { sessionToken, ...data } = args;
    return ctx.db.insert("cards", data);
  },
});

export const update = mutation({
  args: {
    id: v.id("cards"),
    cardTypeId: v.optional(v.id("cardTypes")),
    name: v.optional(v.string()),
    level: v.optional(v.number()),
    orientation: v.optional(v.union(v.literal("vertical"), v.literal("horizontal"))),
    imageStorageId: v.optional(v.id("_storage")),
    descriptionTr: v.optional(v.string()),
    descriptionEn: v.optional(v.string()),
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
  args: { id: v.id("cards"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
  },
});

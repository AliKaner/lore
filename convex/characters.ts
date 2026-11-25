import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireUserId } from "./users";
import { optionalUserId, viewableBook } from "./access";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    originBookId: v.optional(v.id("books")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.originBookId !== undefined) {
      const book = await ctx.db.get(args.originBookId);
      if (!book || book.ownerId !== userId) {
        throw new Error("Bu kitaba paket ekleyemezsin.");
      }
    }
    const characterId = await ctx.db.insert("characters", {
      name: args.name,
      description: args.description,
      creatorId: userId,
      originBookId: args.originBookId,
      createdAt: Date.now(),
    });
    if (args.originBookId !== undefined) {
      await ctx.db.insert("bookCharacters", {
        bookId: args.originBookId,
        characterId,
      });
    }
    return characterId;
  },
});

export const get = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => await ctx.db.get(args.characterId),
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("characters")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .order("desc")
      .take(200);
  },
});

export const listForBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if ((await viewableBook(ctx, args.bookId, userId)) === null) return [];
    const links = await ctx.db
      .query("bookCharacters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .take(200);
    const characters = await Promise.all(
      links.map((link) => ctx.db.get(link.characterId)),
    );
    return characters.filter((c) => c !== null);
  },
});

export const attachToBook = mutation({
  args: { bookId: v.id("books"), characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Bu kitaba paket ekleyemezsin.");
    }
    const existing = await ctx.db
      .query("bookCharacters")
      .withIndex("by_book_and_character", (q) =>
        q.eq("bookId", args.bookId).eq("characterId", args.characterId),
      )
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("bookCharacters", {
      bookId: args.bookId,
      characterId: args.characterId,
    });
  },
});

export const update = mutation({
  args: {
    characterId: v.id("characters"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const character = await ctx.db.get(args.characterId);
    if (!character || character.creatorId !== userId) {
      throw new Error("Bu karakteri düzenleyemezsin.");
    }
    const { characterId, ...patch } = args;
    await ctx.db.patch(characterId, patch);
    return null;
  },
});

// Deletes a character and takes it out of every writing it was part of.
export const remove = mutation({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const character = await ctx.db.get(args.characterId);
    if (!character || character.creatorId !== userId) {
      throw new Error("Bu karakteri silemezsin.");
    }
    if (character.imageStorageId) await ctx.storage.delete(character.imageStorageId);
    await ctx.db.delete(character._id);
    await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, {
      targetType: "character",
      targetId: character._id,
    });
    return null;
  },
});

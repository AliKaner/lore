import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUserId } from "./users";
import { optionalUserId, viewableBook } from "./access";
import { ENTITY_KINDS, fieldsOf } from "./entityKinds";

// The side boards on the writing screen: what a writer pins beside the page
// (notes, checklists, characters from their world, pictures). Each writer has
// their own pair for each writing; nobody else sees them.

const side = v.union(v.literal("left"), v.literal("right"));
const MAX_ITEMS = 60;
const MAX_TEXT = 5_000;
const MAX_CHECKS = 50;

async function ownItem(ctx: MutationCtx, itemId: Id<"boardItems">) {
  const userId = await requireUserId(ctx);
  const item = await ctx.db.get(itemId);
  if (!item || item.ownerId !== userId) throw new Error("Bu kartı düzenleyemezsin.");
  return item;
}

async function boardOf(ctx: MutationCtx, ownerId: Id<"users">, bookId: Id<"books">) {
  return await ctx.db
    .query("boardItems")
    .withIndex("by_owner_and_book", (q) => q.eq("ownerId", ownerId).eq("bookId", bookId))
    .take(MAX_ITEMS + 1);
}

export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (userId === null) return [];
    if ((await viewableBook(ctx, args.bookId, userId)) === null) return [];
    const items = await ctx.db
      .query("boardItems")
      .withIndex("by_owner_and_book", (q) => q.eq("ownerId", userId).eq("bookId", args.bookId))
      .take(MAX_ITEMS);
    const shaped = await Promise.all(
      items.map(async (item) => {
        let entity = null;
        if (item.entityId) {
          const doc = await ctx.db.get(item.entityId);
          if (doc && doc.creatorId === userId) {
            const cover = doc.images.find((image) => image.slot === undefined);
            // A few filled fields, so the card is useful at a glance.
            const facts: { label: string; value: string }[] = [];
            if (doc.fields.age) facts.push({ label: "Yaşı", value: doc.fields.age });
            else if (doc.fields.birthYear) facts.push({ label: "Doğum yılı", value: doc.fields.birthYear });
            for (const field of fieldsOf(doc.kind)) {
              if (facts.length >= 4) break;
              if (field.type !== "text") continue;
              const value = doc.fields[field.key];
              if (value) facts.push({ label: field.label, value });
            }
            entity = {
              _id: doc._id,
              kind: doc.kind,
              kindLabel: ENTITY_KINDS[doc.kind].label,
              name: doc.name,
              summary: doc.summary ?? null,
              coverUrl: cover ? await ctx.storage.getUrl(cover.storageId) : null,
              facts,
            };
          }
        }
        return {
          _id: item._id,
          side: item.side,
          order: item.order,
          kind: item.kind,
          title: item.title ?? "",
          text: item.text ?? "",
          items: item.items ?? [],
          entity,
          imageUrl: item.storageId ? await ctx.storage.getUrl(item.storageId) : null,
        };
      }),
    );
    return shaped.sort((a, b) => a.order - b.order);
  },
});

export const add = mutation({
  args: {
    bookId: v.id("books"),
    side,
    kind: v.union(
      v.literal("note"),
      v.literal("checklist"),
      v.literal("entity"),
      v.literal("image"),
      // Live views: this writing's timeline, its corkboard, today's goal.
      v.literal("timeline"),
      v.literal("plan"),
      v.literal("goal"),
      // A research link: title and address.
      v.literal("link"),
    ),
    entityId: v.optional(v.id("entities")),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if ((await viewableBook(ctx, args.bookId, userId)) === null) throw new Error("Yazı bulunamadı.");
    const existing = await boardOf(ctx, userId, args.bookId);
    if (existing.length >= MAX_ITEMS) throw new Error("Panolar dolu; yeni kart için önce birini kaldır.");
    if (args.kind === "entity") {
      const entity = args.entityId ? await ctx.db.get(args.entityId) : null;
      if (!entity || entity.creatorId !== userId) throw new Error("Bu kayıt eklenemez.");
    }
    if (args.kind === "image" && !args.storageId) throw new Error("Bir görsel seç.");
    const order = existing.reduce((max, item) => Math.max(max, item.order), 0) + 1;
    return await ctx.db.insert("boardItems", {
      ownerId: userId,
      bookId: args.bookId,
      side: args.side,
      order,
      kind: args.kind,
      entityId: args.kind === "entity" ? args.entityId : undefined,
      storageId: args.kind === "image" ? args.storageId : undefined,
      items: args.kind === "checklist" ? [] : undefined,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    itemId: v.id("boardItems"),
    title: v.optional(v.string()),
    text: v.optional(v.string()),
    items: v.optional(v.array(v.object({ text: v.string(), done: v.boolean() }))),
  },
  handler: async (ctx, args) => {
    const item = await ownItem(ctx, args.itemId);
    const patch: Partial<Doc<"boardItems">> = {};
    if (args.title !== undefined) patch.title = args.title.slice(0, 120);
    if (args.text !== undefined) {
      if (args.text.length > MAX_TEXT) throw new Error("Not çok uzun.");
      patch.text = args.text;
    }
    if (args.items !== undefined) {
      if (args.items.length > MAX_CHECKS) throw new Error("Liste çok uzun.");
      patch.items = args.items.map((check) => ({ text: check.text.slice(0, 300), done: check.done }));
    }
    await ctx.db.patch(item._id, patch);
    return null;
  },
});

// Moves a card up or down within its board, or over to the other board.
export const move = mutation({
  args: {
    itemId: v.id("boardItems"),
    to: v.union(v.literal("up"), v.literal("down"), v.literal("left"), v.literal("right")),
  },
  handler: async (ctx, args) => {
    const item = await ownItem(ctx, args.itemId);
    const board = await boardOf(ctx, item.ownerId, item.bookId);
    if (args.to === "left" || args.to === "right") {
      if (item.side === args.to) return null;
      const order = board.reduce((max, other) => Math.max(max, other.order), 0) + 1;
      await ctx.db.patch(item._id, { side: args.to, order });
      return null;
    }
    const column = board.filter((other) => other.side === item.side).sort((a, b) => a.order - b.order);
    const index = column.findIndex((other) => other._id === item._id);
    const neighbour = column[args.to === "up" ? index - 1 : index + 1];
    if (!neighbour) return null;
    await ctx.db.patch(item._id, { order: neighbour.order });
    await ctx.db.patch(neighbour._id, { order: item.order });
    return null;
  },
});

export const remove = mutation({
  args: { itemId: v.id("boardItems") },
  handler: async (ctx, args) => {
    const item = await ownItem(ctx, args.itemId);
    if (item.storageId) await ctx.storage.delete(item.storageId);
    await ctx.db.delete(item._id);
    return null;
  },
});

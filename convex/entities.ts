import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUserId } from "./users";
import { optionalUserId, viewableBook } from "./access";
import {
  ENTITY_KINDS,
  LIMITS,
  entityKindValidator,
  imageField,
  linkField,
  valueKeysOf,
  type EntityKind,
} from "./entityKinds";

/* ---------- Helpers ---------- */

async function ownEntity(ctx: MutationCtx, entityId: Id<"entities">) {
  const userId = await requireUserId(ctx);
  const entity = await ctx.db.get(entityId);
  if (!entity || entity.creatorId !== userId) {
    throw new Error("Bunu düzenleyemezsin.");
  }
  return { userId, entity };
}

async function ownBook(ctx: MutationCtx, bookId: Id<"books">, userId: Id<"users">) {
  const book = await ctx.db.get(bookId);
  if (!book || book.ownerId !== userId) {
    throw new Error("Bu yazıya bir şey ekleyemezsin.");
  }
  return book;
}

function cleanName(name: string) {
  const trimmed = name.trim().replace(/\s+/gu, " ");
  if (trimmed.length === 0) throw new Error("Bir ad yazmalısın.");
  if (trimmed.length > LIMITS.name) throw new Error("Ad çok uzun.");
  return trimmed;
}

function cleanSummary(summary: string) {
  const trimmed = summary.trim();
  if (trimmed.length > LIMITS.summary) throw new Error("Kısa açıklama çok uzun.");
  return trimmed.length > 0 ? trimmed : undefined;
}

async function attach(ctx: MutationCtx, bookId: Id<"books">, entityId: Id<"entities">) {
  const existing = await ctx.db
    .query("bookEntities")
    .withIndex("by_book_and_entity", (q) => q.eq("bookId", bookId).eq("entityId", entityId))
    .unique();
  if (existing === null) await ctx.db.insert("bookEntities", { bookId, entityId });
}

async function isInBook(ctx: QueryCtx, bookId: Id<"books">, entityId: Id<"entities">) {
  const link = await ctx.db
    .query("bookEntities")
    .withIndex("by_book_and_entity", (q) => q.eq("bookId", bookId).eq("entityId", entityId))
    .unique();
  return link !== null;
}

async function coverUrl(ctx: QueryCtx, entity: Doc<"entities">) {
  const cover = entity.images.find((image) => image.slot === undefined);
  return cover ? await ctx.storage.getUrl(cover.storageId) : null;
}

// What a list or a chip needs.
async function brief(ctx: QueryCtx, entity: Doc<"entities">) {
  return {
    _id: entity._id,
    kind: entity.kind,
    name: entity.name,
    summary: entity.summary ?? null,
    coverUrl: await coverUrl(ctx, entity),
    updatedAt: entity.updatedAt,
  };
}

export type EntityBrief = Awaited<ReturnType<typeof brief>>;

/* ---------- Queries ---------- */

export const listMine = query({
  args: { kind: v.optional(entityKindValidator) },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (userId === null) return [];
    const entities = await ctx.db
      .query("entities")
      .withIndex("by_creator_and_kind", (q) =>
        args.kind === undefined ? q.eq("creatorId", userId) : q.eq("creatorId", userId).eq("kind", args.kind),
      )
      .take(500);
    const briefs = await Promise.all(entities.map((entity) => brief(ctx, entity)));
    return briefs.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// Everything named in a writing, for the reader and for highlighting.
export const listForBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if ((await viewableBook(ctx, args.bookId, userId)) === null) return [];
    const links = await ctx.db
      .query("bookEntities")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .take(500);
    const entities = await Promise.all(links.map((link) => ctx.db.get(link.entityId)));
    return await Promise.all(
      entities.filter((entity) => entity !== null).map((entity) => brief(ctx, entity)),
    );
  },
});

type Chip = { _id: Id<"entities">; kind: EntityKind; name: string };
const chip = (entity: Doc<"entities">): Chip => ({
  _id: entity._id,
  kind: entity.kind,
  name: entity.name,
});

// One entity with everything its page shows. Its creator sees it all; a
// reader sees it through a writing it is part of (`bookId`), and only the
// links that lead to other things of that writing.
export const get = query({
  args: { entityId: v.id("entities"), bookId: v.optional(v.id("books")) },
  handler: async (ctx, args) => {
    const viewerId = await optionalUserId(ctx);
    const entity = await ctx.db.get(args.entityId);
    if (entity === null) return null;
    const canEdit = entity.creatorId === viewerId;
    if (!canEdit) {
      if (args.bookId === undefined) return null;
      if ((await viewableBook(ctx, args.bookId, viewerId)) === null) return null;
      if (!(await isInBook(ctx, args.bookId, entity._id))) return null;
    }
    const bookId = args.bookId;
    const visible = async (other: Doc<"entities"> | null): Promise<Doc<"entities"> | null> => {
      if (other === null) return null;
      if (canEdit) return other;
      return bookId !== undefined && (await isInBook(ctx, bookId, other._id)) ? other : null;
    };
    const outgoingOf = async (fromId: Id<"entities">, role: string) => {
      const rows = await ctx.db
        .query("entityLinks")
        .withIndex("by_from_and_role", (q) => q.eq("fromId", fromId).eq("role", role))
        .take(LIMITS.links);
      return rows;
    };

    // The entity's own link fields.
    const links: Record<string, Chip[]> = {};
    for (const section of ENTITY_KINDS[entity.kind].sections) {
      for (const field of section.fields) {
        if (field.type !== "link") continue;
        const rows = await outgoingOf(entity._id, field.key);
        const targets = await Promise.all(rows.map(async (row) => visible(await ctx.db.get(row.toId))));
        links[field.key] = targets.filter((t) => t !== null).map(chip);
      }
    }

    // What points here, read from the other side ("Vatandaşları").
    const incomingRows = await ctx.db
      .query("entityLinks")
      .withIndex("by_to", (q) => q.eq("toId", entity._id))
      .take(300);
    const groups = new Map<string, Chip[]>();
    const children: Chip[] = [];
    for (const row of incomingRows) {
      const from = await visible(await ctx.db.get(row.fromId));
      if (from === null) continue;
      if (entity.kind === "character" && (row.role === "father" || row.role === "mother")) {
        if (!children.some((c) => c._id === from._id)) children.push(chip(from));
        continue;
      }
      // A link the entity already shows itself (a spouse both ways).
      if ((links[row.role] ?? []).some((c) => c._id === from._id)) continue;
      const label = linkField(from.kind, row.role)?.reverse;
      if (!label) continue;
      const list = groups.get(label) ?? [];
      if (!list.some((c) => c._id === from._id)) list.push(chip(from));
      groups.set(label, list);
    }
    const incoming = [...groups.entries()].map(([label, items]) => ({ label, items }));

    // A character's family beyond the parents, worked out from them.
    let family: { grandparents: Chip[]; siblings: Chip[]; children: Chip[] } | null = null;
    if (entity.kind === "character") {
      const parents = [...(links.father ?? []), ...(links.mother ?? [])];
      const grandparents: Chip[] = [];
      const siblings: Chip[] = [];
      for (const parent of parents) {
        for (const role of ["father", "mother"]) {
          for (const row of await outgoingOf(parent._id, role)) {
            const grandparent = await visible(await ctx.db.get(row.toId));
            if (grandparent && !grandparents.some((g) => g._id === grandparent._id)) {
              grandparents.push(chip(grandparent));
            }
          }
        }
        const parentChildren = await ctx.db
          .query("entityLinks")
          .withIndex("by_to", (q) => q.eq("toId", parent._id))
          .take(LIMITS.links);
        for (const row of parentChildren) {
          if (row.role !== "father" && row.role !== "mother") continue;
          if (row.fromId === entity._id || siblings.some((s) => s._id === row.fromId)) continue;
          const sibling = await visible(await ctx.db.get(row.fromId));
          if (sibling) siblings.push(chip(sibling));
        }
      }
      family = { grandparents, siblings, children };
    }

    const images = await Promise.all(
      entity.images.map(async (image) => ({
        storageId: image.storageId,
        slot: image.slot ?? null,
        url: await ctx.storage.getUrl(image.storageId),
      })),
    );

    // The creator also sees which writings it is part of.
    let books: { _id: Id<"books">; title: string }[] = [];
    if (canEdit) {
      const bookLinks = await ctx.db
        .query("bookEntities")
        .withIndex("by_entity", (q) => q.eq("entityId", entity._id))
        .take(100);
      const found = await Promise.all(bookLinks.map((link) => ctx.db.get(link.bookId)));
      books = found.filter((b) => b !== null).map((b) => ({ _id: b._id, title: b.title }));
    }

    return {
      _id: entity._id,
      kind: entity.kind,
      name: entity.name,
      summary: entity.summary ?? null,
      fields: entity.fields,
      custom: entity.custom,
      images,
      updatedAt: entity.updatedAt,
      canEdit,
      links,
      incoming,
      family,
      books,
    };
  },
});

/* ---------- Mutations ---------- */

export const create = mutation({
  args: {
    kind: entityKindValidator,
    name: v.string(),
    summary: v.optional(v.string()),
    // Made while writing: it becomes part of that writing.
    bookId: v.optional(v.id("books")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.bookId !== undefined) await ownBook(ctx, args.bookId, userId);
    const now = Date.now();
    const entityId = await ctx.db.insert("entities", {
      kind: args.kind,
      name: cleanName(args.name),
      summary: args.summary === undefined ? undefined : cleanSummary(args.summary),
      fields: {},
      custom: [],
      images: [],
      creatorId: userId,
      createdAt: now,
      updatedAt: now,
    });
    if (args.bookId !== undefined) await attach(ctx, args.bookId, entityId);
    return entityId;
  },
});

// Saves what changed. A field set to "" is cleared.
export const update = mutation({
  args: {
    entityId: v.id("entities"),
    name: v.optional(v.string()),
    summary: v.optional(v.string()),
    fields: v.optional(v.record(v.string(), v.string())),
    custom: v.optional(v.array(v.object({ label: v.string(), value: v.string() }))),
  },
  handler: async (ctx, args) => {
    const { entity } = await ownEntity(ctx, args.entityId);
    const patch: Partial<Doc<"entities">> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = cleanName(args.name);
    if (args.summary !== undefined) patch.summary = cleanSummary(args.summary);
    if (args.fields !== undefined) {
      const allowed = valueKeysOf(entity.kind);
      const fields = { ...entity.fields };
      for (const [key, raw] of Object.entries(args.fields)) {
        const type = allowed.get(key);
        if (type === undefined) throw new Error("Bilinmeyen bir alan.");
        const value = raw.trim();
        if (value.length > LIMITS[type]) throw new Error("Bu alan çok uzun.");
        if (value.length === 0) delete fields[key];
        else fields[key] = value;
      }
      patch.fields = fields;
    }
    if (args.custom !== undefined) {
      if (args.custom.length > LIMITS.customFields) throw new Error("Çok fazla alan.");
      patch.custom = args.custom.map(({ label, value }) => {
        if (label.length > LIMITS.customLabel || value.length > LIMITS.longtext) {
          throw new Error("Bu alan çok uzun.");
        }
        return { label, value };
      });
    }
    await ctx.db.patch(entity._id, patch);
    return null;
  },
});

// Replaces a link field's value: "Babası" → one character, "Müttefikleri" →
// several countries. Only the writer's own entities can be linked.
export const setLinks = mutation({
  args: {
    entityId: v.id("entities"),
    role: v.string(),
    toIds: v.array(v.id("entities")),
  },
  handler: async (ctx, args) => {
    const { userId, entity } = await ownEntity(ctx, args.entityId);
    const field = linkField(entity.kind, args.role);
    if (field === null) throw new Error("Bilinmeyen bir alan.");
    const toIds = [...new Set(args.toIds)];
    if (!field.multiple && toIds.length > 1) throw new Error("Buraya yalnızca bir tane seçilebilir.");
    if (toIds.length > LIMITS.links) throw new Error("Çok fazla bağlantı.");
    for (const toId of toIds) {
      if (toId === entity._id) throw new Error("Kendisine bağlanamaz.");
      const target = await ctx.db.get(toId);
      if (!target || target.creatorId !== userId) throw new Error("Bu bağlantı kurulamaz.");
      if (!field.kinds.includes(target.kind)) throw new Error("Buraya bu tür seçilemez.");
    }
    const existing = await ctx.db
      .query("entityLinks")
      .withIndex("by_from_and_role", (q) => q.eq("fromId", entity._id).eq("role", args.role))
      .take(LIMITS.links + 1);
    for (const row of existing) await ctx.db.delete(row._id);
    for (const toId of toIds) {
      await ctx.db.insert("entityLinks", { creatorId: userId, fromId: entity._id, role: args.role, toId });
    }
    await ctx.db.patch(entity._id, { updatedAt: Date.now() });
    return null;
  },
});

// Adds an uploaded picture: to the gallery, or into a field (a map), where it
// replaces the one before.
export const addImage = mutation({
  args: {
    entityId: v.id("entities"),
    storageId: v.id("_storage"),
    slot: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { entity } = await ownEntity(ctx, args.entityId);
    let images = entity.images;
    if (args.slot !== undefined) {
      if (imageField(entity.kind, args.slot) === null) throw new Error("Bilinmeyen bir alan.");
      for (const old of images.filter((image) => image.slot === args.slot)) {
        await ctx.storage.delete(old.storageId);
      }
      images = images.filter((image) => image.slot !== args.slot);
    } else if (images.filter((image) => image.slot === undefined).length >= LIMITS.images) {
      throw new Error("Görsel sınırına ulaştın; yenisi için birini kaldır.");
    }
    images = [...images, { storageId: args.storageId, slot: args.slot }];
    await ctx.db.patch(entity._id, { images, updatedAt: Date.now() });
    return null;
  },
});

export const removeImage = mutation({
  args: { entityId: v.id("entities"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const { entity } = await ownEntity(ctx, args.entityId);
    if (!entity.images.some((image) => image.storageId === args.storageId)) return null;
    await ctx.storage.delete(args.storageId);
    await ctx.db.patch(entity._id, {
      images: entity.images.filter((image) => image.storageId !== args.storageId),
      updatedAt: Date.now(),
    });
    return null;
  },
});

// Makes a gallery picture the portrait (the first one).
export const makeCover = mutation({
  args: { entityId: v.id("entities"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const { entity } = await ownEntity(ctx, args.entityId);
    const picked = entity.images.find((image) => image.storageId === args.storageId && image.slot === undefined);
    if (!picked) return null;
    await ctx.db.patch(entity._id, {
      images: [picked, ...entity.images.filter((image) => image !== picked)],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const attachToBook = mutation({
  args: { bookId: v.id("books"), entityId: v.id("entities") },
  handler: async (ctx, args) => {
    const { userId } = await ownEntity(ctx, args.entityId);
    await ownBook(ctx, args.bookId, userId);
    await attach(ctx, args.bookId, args.entityId);
    return null;
  },
});

export const detachFromBook = mutation({
  args: { bookId: v.id("books"), entityId: v.id("entities") },
  handler: async (ctx, args) => {
    const { userId } = await ownEntity(ctx, args.entityId);
    await ownBook(ctx, args.bookId, userId);
    const link = await ctx.db
      .query("bookEntities")
      .withIndex("by_book_and_entity", (q) => q.eq("bookId", args.bookId).eq("entityId", args.entityId))
      .unique();
    if (link) await ctx.db.delete(link._id);
    return null;
  },
});

// Deletes an entity with its pictures; its links and writings are swept after.
export const remove = mutation({
  args: { entityId: v.id("entities") },
  handler: async (ctx, args) => {
    const { entity } = await ownEntity(ctx, args.entityId);
    for (const image of entity.images) await ctx.storage.delete(image.storageId);
    await ctx.db.delete(entity._id);
    await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, {
      targetType: "entity",
      targetId: entity._id,
    });
    return null;
  },
});

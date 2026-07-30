import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const LORE_TYPE = v.union(
  v.literal("character"),
  v.literal("city"),
  v.literal("item"),
  v.literal("story"),
  v.literal("other"),
  v.literal("location"),
  v.literal("faction")
);

async function verifySession(ctx: { db: any }, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
}

// relatedEntryIds is meant to be a symmetric relationship — if X lists Y, Y should
// list X back. These helpers keep the other side of each edge in sync so the
// connection shows up no matter which entry you edited it from.
async function addBacklink(ctx: { db: any }, targetId: any, backId: any) {
  const target = await ctx.db.get(targetId);
  if (!target) return;
  const ids = target.relatedEntryIds ?? [];
  if (!ids.some((x: any) => String(x) === String(backId))) {
    await ctx.db.patch(targetId, { relatedEntryIds: [...ids, backId] });
  }
}

async function removeBacklink(ctx: { db: any }, targetId: any, backId: any) {
  const target = await ctx.db.get(targetId);
  if (!target) return;
  const ids = (target.relatedEntryIds ?? []).filter((x: any) => String(x) !== String(backId));
  await ctx.db.patch(targetId, { relatedEntryIds: ids });
}

export const list = query({
  handler: async (ctx) => {
    const entries = await ctx.db.query("loreEntries").collect();
    return Promise.all(
      entries.map(async (e) => ({
        ...e,
        imageUrl: e.imageStorageId
          ? await ctx.storage.getUrl(e.imageStorageId)
          : null,
      }))
    );
  },
});

export const listByUniverse = query({
  args: { universeId: v.id("universes") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("loreEntries")
      .withIndex("by_universe", (q) => q.eq("universeId", args.universeId))
      .collect();
    const published = entries.filter((e) => e.status !== "pending");
    return Promise.all(
      published.map(async (e) => ({
        ...e,
        imageUrl: e.imageStorageId
          ? await ctx.storage.getUrl(e.imageStorageId)
          : null,
      }))
    );
  },
});

export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("loreEntries")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    const published = entries.filter((e) => e.status !== "pending");
    return Promise.all(
      published.map(async (e) => ({
        ...e,
        imageUrl: e.imageStorageId
          ? await ctx.storage.getUrl(e.imageStorageId)
          : null,
      }))
    );
  },
});

export const getById = query({
  args: { id: v.id("loreEntries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) return null;
    const category = await ctx.db.get(entry.categoryId);
    const universe = await ctx.db.get(entry.universeId);
    const relatedEntries = entry.relatedEntryIds
      ? await Promise.all(
          entry.relatedEntryIds.map(async (relId) => {
            const rel = await ctx.db.get(relId);
            return rel
              ? {
                  ...rel,
                  imageUrl: rel.imageStorageId
                    ? await ctx.storage.getUrl(rel.imageStorageId)
                    : null,
                }
              : null;
          })
        )
      : [];
    return {
      ...entry,
      imageUrl: entry.imageStorageId
        ? await ctx.storage.getUrl(entry.imageStorageId)
        : null,
      category,
      universe,
      relatedEntries: relatedEntries.filter(Boolean),
      views: entry.views ?? 0,
      likeCount: entry.likeCount ?? 0,
    };
  },
});

export const incrementViews = mutation({
  args: { id: v.id("loreEntries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) throw new Error("Lore entry not found");
    const currentViews = entry.views ?? 0;
    await ctx.db.patch(args.id, { views: currentViews + 1 });
    return currentViews + 1;
  },
});

export const create = mutation({
  args: {
    universeId: v.id("universes"),
    categoryId: v.id("categories"),
    name: v.string(),
    type: LORE_TYPE,
    imageStorageId: v.optional(v.id("_storage")),
    contentTr: v.string(),
    contentEn: v.string(),
    relatedEntryIds: v.optional(v.array(v.id("loreEntries"))),
    order: v.optional(v.number()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { sessionToken, ...data } = args;
    const newId = await ctx.db.insert("loreEntries", data);
    for (const relId of data.relatedEntryIds ?? []) {
      await addBacklink(ctx, relId, newId);
    }
    return newId;
  },
});

export const update = mutation({
  args: {
    id: v.id("loreEntries"),
    universeId: v.optional(v.id("universes")),
    categoryId: v.optional(v.id("categories")),
    name: v.optional(v.string()),
    type: v.optional(LORE_TYPE),
    imageStorageId: v.optional(v.id("_storage")),
    contentTr: v.optional(v.string()),
    contentEn: v.optional(v.string()),
    relatedEntryIds: v.optional(v.array(v.id("loreEntries"))),
    order: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("published"))),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { id, sessionToken, ...data } = args;

    if (data.relatedEntryIds !== undefined) {
      const existing = await ctx.db.get(id);
      const oldIds = new Set((existing?.relatedEntryIds ?? []).map((x: any) => String(x)));
      const newIds = new Set(data.relatedEntryIds.map((x) => String(x)));

      for (const relId of data.relatedEntryIds) {
        if (!oldIds.has(String(relId))) await addBacklink(ctx, relId, id);
      }
      for (const relId of existing?.relatedEntryIds ?? []) {
        if (!newIds.has(String(relId))) await removeBacklink(ctx, relId, id);
      }
    }

    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("loreEntries"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const existing = await ctx.db.get(args.id);
    for (const relId of existing?.relatedEntryIds ?? []) {
      await removeBacklink(ctx, relId, args.id);
    }
    await ctx.db.delete(args.id);
  },
});

import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUserId } from "./users";
import { optionalUserId } from "./access";

// The writer's timeline. Private: only its writer sees and changes it.

const LIMITS = { title: 160, description: 4000, dateLabel: 80, entities: 30, events: 1000 };

function clean(text: string | undefined, max: number, what: string) {
  if (text === undefined) return undefined;
  const trimmed = text.trim();
  if (trimmed.length > max) throw new Error(`${what} çok uzun.`);
  return trimmed.length > 0 ? trimmed : undefined;
}

async function ownEvent(ctx: MutationCtx, eventId: Id<"events">) {
  const userId = await requireUserId(ctx);
  const event = await ctx.db.get(eventId);
  if (!event || event.creatorId !== userId) throw new Error("Bunu düzenleyemezsin.");
  return { userId, event };
}

// The book and chapter must be the writer's own (the chapter in that book).
async function checkPlace(
  ctx: MutationCtx,
  userId: Id<"users">,
  bookId: Id<"books"> | undefined,
  chapterId: Id<"chapters"> | undefined,
) {
  if (bookId !== undefined) {
    const book = await ctx.db.get(bookId);
    if (!book || book.ownerId !== userId) throw new Error("Bu yazıya bir şey ekleyemezsin.");
  }
  if (chapterId !== undefined) {
    const chapter = await ctx.db.get(chapterId);
    if (!chapter || chapter.bookId !== bookId) throw new Error("Bu bölüm o yazıda değil.");
  }
}

async function setEntities(ctx: MutationCtx, userId: Id<"users">, eventId: Id<"events">, entityIds: Id<"entities">[]) {
  const unique = [...new Set(entityIds)];
  if (unique.length > LIMITS.entities) throw new Error("Çok fazla katılımcı.");
  for (const id of unique) {
    const entity = await ctx.db.get(id);
    if (!entity || entity.creatorId !== userId) throw new Error("Yalnızca kendi evrenindeki kayıtları ekleyebilirsin.");
  }
  const existing = await ctx.db
    .query("eventEntities")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .take(LIMITS.entities + 10);
  for (const row of existing) await ctx.db.delete(row._id);
  for (const entityId of unique) await ctx.db.insert("eventEntities", { eventId, entityId });
}

// A year as a whole number, or nothing.
const yearValidator = v.optional(v.union(v.number(), v.null()));
function cleanYear(year: number | null | undefined) {
  if (year === undefined) return undefined;
  if (year === null) return null;
  if (!Number.isFinite(year) || Math.abs(year) > 1e9) throw new Error("Geçersiz yıl.");
  return Math.round(year);
}

async function shape(ctx: QueryCtx, event: Doc<"events">) {
  const rows = await ctx.db
    .query("eventEntities")
    .withIndex("by_event", (q) => q.eq("eventId", event._id))
    .take(LIMITS.entities + 10);
  const entities = (await Promise.all(rows.map((row) => ctx.db.get(row.entityId))))
    .filter((e) => e !== null)
    .map((e) => ({
      _id: e._id,
      kind: e.kind,
      name: e.name,
      birthYear: e.fields.birthYear ?? null,
    }));
  const chapter = event.chapterId ? await ctx.db.get(event.chapterId) : null;
  const book = event.bookId ? await ctx.db.get(event.bookId) : null;
  return {
    _id: event._id,
    title: event.title,
    description: event.description ?? null,
    year: event.year ?? null,
    dateLabel: event.dateLabel ?? null,
    order: event.order,
    bookId: book?._id ?? null,
    bookTitle: book?.title ?? null,
    chapterId: chapter?._id ?? null,
    chapterTitle: chapter?.title ?? null,
    entities,
  };
}

export type TimelineEvent = Awaited<ReturnType<typeof shape>>;

function sortEvents<T extends { year: number | null; order: number }>(events: T[]) {
  // Dated events by year; undated ones after them, in their own order.
  return events.sort((a, b) => {
    if (a.year === null && b.year === null) return a.order - b.order;
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    return a.year - b.year || a.order - b.order;
  });
}

export const list = query({
  args: { bookId: v.optional(v.id("books")), entityId: v.optional(v.id("entities")) },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (userId === null) return [];
    let events: Doc<"events">[];
    if (args.entityId !== undefined) {
      const entity = await ctx.db.get(args.entityId);
      if (!entity || entity.creatorId !== userId) return [];
      const rows = await ctx.db
        .query("eventEntities")
        .withIndex("by_entity", (q) => q.eq("entityId", args.entityId!))
        .take(LIMITS.events);
      events = (await Promise.all(rows.map((row) => ctx.db.get(row.eventId)))).filter(
        (e): e is Doc<"events"> => e !== null && e.creatorId === userId,
      );
    } else {
      events = await ctx.db
        .query("events")
        .withIndex("by_creator_and_year", (q) => q.eq("creatorId", userId))
        .take(LIMITS.events);
    }
    if (args.bookId !== undefined) events = events.filter((e) => e.bookId === args.bookId);
    return sortEvents(await Promise.all(events.map((e) => shape(ctx, e))));
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    year: yearValidator,
    dateLabel: v.optional(v.string()),
    bookId: v.optional(v.id("books")),
    chapterId: v.optional(v.id("chapters")),
    entityIds: v.optional(v.array(v.id("entities"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const title = clean(args.title, LIMITS.title, "Başlık");
    if (!title) throw new Error("Olaya bir ad ver.");
    await checkPlace(ctx, userId, args.bookId, args.chapterId);
    const eventId = await ctx.db.insert("events", {
      creatorId: userId,
      title,
      description: clean(args.description, LIMITS.description, "Açıklama"),
      year: cleanYear(args.year) ?? undefined,
      dateLabel: clean(args.dateLabel, LIMITS.dateLabel, "Tarih"),
      bookId: args.bookId,
      chapterId: args.chapterId,
      order: Date.now(),
      createdAt: Date.now(),
    });
    if (args.entityIds) await setEntities(ctx, userId, eventId, args.entityIds);
    return eventId;
  },
});

export const update = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    year: yearValidator,
    dateLabel: v.optional(v.string()),
    bookId: v.optional(v.union(v.id("books"), v.null())),
    chapterId: v.optional(v.union(v.id("chapters"), v.null())),
    entityIds: v.optional(v.array(v.id("entities"))),
  },
  handler: async (ctx, args) => {
    const { userId, event } = await ownEvent(ctx, args.eventId);
    const patch: Partial<Doc<"events">> = {};
    if (args.title !== undefined) {
      const title = clean(args.title, LIMITS.title, "Başlık");
      if (!title) throw new Error("Olaya bir ad ver.");
      patch.title = title;
    }
    if (args.description !== undefined) patch.description = clean(args.description, LIMITS.description, "Açıklama");
    if (args.dateLabel !== undefined) patch.dateLabel = clean(args.dateLabel, LIMITS.dateLabel, "Tarih");
    const year = cleanYear(args.year);
    if (year !== undefined) patch.year = year ?? undefined;
    const bookId = args.bookId === undefined ? event.bookId : (args.bookId ?? undefined);
    let chapterId = args.chapterId === undefined ? event.chapterId : (args.chapterId ?? undefined);
    if (bookId !== event.bookId && args.chapterId === undefined) chapterId = undefined;
    await checkPlace(ctx, userId, bookId, chapterId);
    patch.bookId = bookId;
    patch.chapterId = chapterId;
    await ctx.db.patch(event._id, patch);
    if (args.entityIds) await setEntities(ctx, userId, event._id, args.entityIds);
    return null;
  },
});

// Moves an event before or after its neighbour in the same year.
export const move = mutation({
  args: { eventId: v.id("events"), direction: v.union(v.literal("up"), v.literal("down")) },
  handler: async (ctx, args) => {
    const { userId, event } = await ownEvent(ctx, args.eventId);
    const sameYear = await ctx.db
      .query("events")
      .withIndex("by_creator_and_year", (q) => q.eq("creatorId", userId).eq("year", event.year))
      .take(LIMITS.events);
    const ordered = sameYear.sort((a, b) => a.order - b.order);
    const i = ordered.findIndex((e) => e._id === event._id);
    const j = args.direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ordered.length) return null;
    const other = ordered[j];
    const a = event.order === other.order ? other.order + (args.direction === "up" ? -1 : 1) : other.order;
    await ctx.db.patch(other._id, { order: event.order });
    await ctx.db.patch(event._id, { order: a });
    return null;
  },
});

export const remove = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const { event } = await ownEvent(ctx, args.eventId);
    const rows = await ctx.db
      .query("eventEntities")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .take(LIMITS.entities + 10);
    for (const row of rows) await ctx.db.delete(row._id);
    await ctx.db.delete(event._id);
    return null;
  },
});

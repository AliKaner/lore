import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUserId } from "./users";
import { canWriteBook, optionalUserId } from "./access";

// The corkboard of a writing: its owner and co-authors plan on it together.

const colorValidator = v.union(v.literal("plain"), v.literal("caramel"), v.literal("sapphire"), v.literal("rose"), v.literal("sage"));
const statusValidator = v.union(v.literal("idea"), v.literal("writing"), v.literal("revise"), v.literal("done"));
const MAX_CARDS = 500;

async function writableBook(ctx: MutationCtx, bookId: Id<"books">) {
  const userId = await requireUserId(ctx);
  const book = await ctx.db.get(bookId);
  if (!book || !(await canWriteBook(ctx, book, userId))) throw new Error("Bu panoyu düzenleyemezsin.");
  return { userId, book };
}

async function writableCard(ctx: MutationCtx, cardId: Id<"planCards">) {
  const card = await ctx.db.get(cardId);
  if (!card) throw new Error("Kart bulunamadı.");
  const { userId } = await writableBook(ctx, card.bookId);
  return { userId, card };
}

function cleanTitle(title: string) {
  const t = title.trim();
  if (!t) throw new Error("Karta bir başlık yaz.");
  if (t.length > 160) throw new Error("Başlık çok uzun.");
  return t;
}

function cleanSynopsis(text: string | undefined) {
  if (text === undefined) return undefined;
  if (text.length > 3000) throw new Error("Özet çok uzun.");
  return text.trim() || undefined;
}

async function checkChapter(ctx: MutationCtx, bookId: Id<"books">, chapterId: Id<"chapters"> | undefined) {
  if (chapterId === undefined) return;
  const chapter = await ctx.db.get(chapterId);
  if (!chapter || chapter.bookId !== bookId) throw new Error("Bu bölüm o yazıda değil.");
}

export const list = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || !(await canWriteBook(ctx, book, userId))) return null;
    const cards = await ctx.db
      .query("planCards")
      .withIndex("by_book_and_order", (q) => q.eq("bookId", args.bookId))
      .take(MAX_CARDS);
    return await Promise.all(
      cards.map(async (card) => {
        const chapter = card.chapterId ? await ctx.db.get(card.chapterId) : null;
        return {
          ...card,
          chapter: chapter ? { _id: chapter._id, title: chapter.title, words: chapter.words ?? 0, status: chapter.status } : null,
        };
      }),
    );
  },
});

async function lastOrder(ctx: MutationCtx, bookId: Id<"books">) {
  const last = await ctx.db
    .query("planCards")
    .withIndex("by_book_and_order", (q) => q.eq("bookId", bookId))
    .order("desc")
    .first();
  return last?.order ?? 0;
}

export const create = mutation({
  args: {
    bookId: v.id("books"),
    title: v.string(),
    synopsis: v.optional(v.string()),
    color: v.optional(colorValidator),
    chapterId: v.optional(v.id("chapters")),
  },
  handler: async (ctx, args) => {
    const { userId } = await writableBook(ctx, args.bookId);
    await checkChapter(ctx, args.bookId, args.chapterId);
    return await ctx.db.insert("planCards", {
      bookId: args.bookId,
      title: cleanTitle(args.title),
      synopsis: cleanSynopsis(args.synopsis),
      color: args.color ?? "plain",
      status: "idea",
      order: (await lastOrder(ctx, args.bookId)) + 1024,
      chapterId: args.chapterId,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    cardId: v.id("planCards"),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    color: v.optional(colorValidator),
    status: v.optional(statusValidator),
    chapterId: v.optional(v.union(v.id("chapters"), v.null())),
  },
  handler: async (ctx, args) => {
    const { card } = await writableCard(ctx, args.cardId);
    const patch: Partial<Doc<"planCards">> = {};
    if (args.title !== undefined) patch.title = cleanTitle(args.title);
    if (args.synopsis !== undefined) patch.synopsis = cleanSynopsis(args.synopsis);
    if (args.color !== undefined) patch.color = args.color;
    if (args.status !== undefined) patch.status = args.status;
    if (args.chapterId !== undefined) {
      await checkChapter(ctx, card.bookId, args.chapterId ?? undefined);
      patch.chapterId = args.chapterId ?? undefined;
    }
    await ctx.db.patch(card._id, patch);
    return null;
  },
});

// Puts a card between two others (or at an end): its order becomes the
// midpoint, and the whole board is spaced out again when it gets tight.
export const move = mutation({
  args: { cardId: v.id("planCards"), beforeId: v.optional(v.id("planCards")) },
  handler: async (ctx, args) => {
    const { card } = await writableCard(ctx, args.cardId);
    const cards = (
      await ctx.db
        .query("planCards")
        .withIndex("by_book_and_order", (q) => q.eq("bookId", card.bookId))
        .take(MAX_CARDS)
    ).filter((c) => c._id !== card._id);
    const index = args.beforeId ? cards.findIndex((c) => c._id === args.beforeId) : cards.length;
    const at = index < 0 ? cards.length : index;
    const prev = at > 0 ? cards[at - 1].order : (cards[0]?.order ?? 1024) - 1024;
    const next = at < cards.length ? cards[at].order : prev + 2048;
    if (next - prev > 1e-6) {
      await ctx.db.patch(card._id, { order: (prev + next) / 2 });
      return null;
    }
    cards.splice(at, 0, card);
    for (const [i, c] of cards.entries()) await ctx.db.patch(c._id, { order: (i + 1) * 1024 });
    return null;
  },
});

export const remove = mutation({
  args: { cardId: v.id("planCards") },
  handler: async (ctx, args) => {
    const { card } = await writableCard(ctx, args.cardId);
    await ctx.db.delete(card._id);
    return null;
  },
});

// One card for every chapter on the main line that has none yet, in
// reading order: a quick start for a writing already underway.
export const fromChapters = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const { userId } = await writableBook(ctx, args.bookId);
    const existing = await ctx.db
      .query("planCards")
      .withIndex("by_book_and_order", (q) => q.eq("bookId", args.bookId))
      .take(MAX_CARDS);
    const linked = new Set(existing.map((c) => c.chapterId).filter(Boolean));
    let order = (existing[existing.length - 1]?.order ?? 0) + 1024;
    let parent: Id<"chapters"> | undefined = undefined;
    let added = 0;
    for (let depth = 0; depth < 1000; depth++) {
      const children = await ctx.db
        .query("chapters")
        .withIndex("by_book_and_parent", (q) => q.eq("bookId", args.bookId).eq("parentChapterId", parent))
        .take(200);
      const next: Doc<"chapters"> | undefined = children.find((c) => c.isCanonical) ?? children[0];
      if (!next) break;
      if (!linked.has(next._id) && (next.status === "published" || next.authorId === userId)) {
        await ctx.db.insert("planCards", {
          bookId: args.bookId,
          title: next.title,
          color: "plain",
          status: next.status === "published" ? "done" : "writing",
          order,
          chapterId: next._id,
          createdBy: userId,
          createdAt: Date.now(),
        });
        order += 1024;
        added += 1;
      }
      parent = next._id;
    }
    return added;
  },
});

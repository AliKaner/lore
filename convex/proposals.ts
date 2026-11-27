import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { requireUserId } from "./users";
import { canViewChapter, canWriteBook, optionalUserId } from "./access";
import { withoutAuthorNotes } from "./chapters";
import { snapshotBeforeChange, wordsIn } from "./versions";
import { recordDeskChange } from "./desk";

// Suggested changes to a chapter, like pull requests: a co-author (or the
// owner, on a co-author's chapter) writes their version; the chapter's
// author or the writing's owner sees what changed and merges it or closes
// it. Merging keeps the old text in the chapter's version history.

const MAX_OPEN = 50;

async function usernameOf(ctx: QueryCtx, userId: Id<"users">) {
  return (await ctx.runQuery(components.authUsername.public.getUsername, { userId })) as string | null;
}

// The chapter's author and the writing's owner decide.
function decides(chapter: Doc<"chapters">, book: Doc<"books">, userId: Id<"users"> | null) {
  return userId !== null && (chapter.authorId === userId || book.ownerId === userId);
}

export const listForChapter = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (userId === null) return null;
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) return null;
    const book = await ctx.db.get(chapter.bookId);
    if (!book) return null;
    const canDecide = decides(chapter, book, userId);
    const canPropose = !canDecide || book.ownerId === userId ? await canWriteBook(ctx, book, userId) : false;
    const open = await ctx.db
      .query("proposals")
      .withIndex("by_chapter_and_status", (q) => q.eq("chapterId", chapter._id).eq("status", "open"))
      .take(MAX_OPEN);
    const visible = open.filter((p) => canDecide || p.proposerId === userId);
    return {
      canDecide,
      canPropose: canPropose && chapter.status === "published" && chapter.authorId !== userId,
      proposals: await Promise.all(
        visible.map(async (p) => ({
          _id: p._id,
          title: p.title,
          note: p.note ?? null,
          content: p.content,
          baseContent: p.baseContent,
          // Whether the chapter changed since the suggestion was written.
          stale: p.baseContent !== withoutAuthorNotes(chapter.content),
          proposerName: await usernameOf(ctx, p.proposerId),
          mine: p.proposerId === userId,
          createdAt: p.createdAt,
        })),
      ),
    };
  },
});

// Open suggestions across a writing, for its owner.
export const openCount = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || book.ownerId !== userId) return 0;
    const open = await ctx.db
      .query("proposals")
      .withIndex("by_book_and_status", (q) => q.eq("bookId", book._id).eq("status", "open"))
      .take(MAX_OPEN);
    return open.length;
  },
});

export const create = mutation({
  args: {
    chapterId: v.id("chapters"),
    title: v.string(),
    content: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter || !(await canViewChapter(ctx, chapter, userId))) throw new Error("Bölüm bulunamadı.");
    const book = await ctx.db.get(chapter.bookId);
    if (!book || !(await canWriteBook(ctx, book, userId))) {
      throw new Error("Yalnızca bu yazının yazarları değişiklik önerebilir.");
    }
    if (chapter.authorId === userId) throw new Error("Kendi bölümünü doğrudan düzenleyebilirsin.");
    if (chapter.status !== "published") throw new Error("Yalnızca yayındaki bir bölüme öneri yapılır.");
    if (args.content.length > 1_000_000) throw new Error("Metin çok uzun.");
    const title = args.title.trim() || chapter.title;
    const note = args.note?.trim().slice(0, 1000) || undefined;
    const open = await ctx.db
      .query("proposals")
      .withIndex("by_chapter_and_status", (q) => q.eq("chapterId", chapter._id).eq("status", "open"))
      .take(MAX_OPEN);
    if (open.length >= MAX_OPEN) throw new Error("Bu bölümde çok fazla açık öneri var.");
    return await ctx.db.insert("proposals", {
      bookId: chapter.bookId,
      chapterId: chapter._id,
      proposerId: userId,
      title,
      note,
      content: args.content,
      baseContent: withoutAuthorNotes(chapter.content),
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const merge = mutation({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || proposal.status !== "open") throw new Error("Bu öneri artık açık değil.");
    const chapter = await ctx.db.get(proposal.chapterId);
    const book = chapter ? await ctx.db.get(chapter.bookId) : null;
    if (!chapter || !book || !decides(chapter, book, userId)) throw new Error("Bu öneriyi yalnızca bölümün yazarı ya da yazının sahibi birleştirir.");
    // The text before the merge stays in the version history.
    await snapshotBeforeChange(ctx, chapter, { title: proposal.title, content: proposal.content, status: "published" });
    const before = chapter.words ?? wordsIn(chapter.content);
    const after = wordsIn(proposal.content);
    await ctx.db.patch(chapter._id, {
      title: proposal.title,
      content: proposal.content,
      words: after,
      updatedAt: Date.now(),
    });
    await recordDeskChange(ctx, chapter.bookId, chapter, { words: after - before, chapters: 0, touched: true });
    await ctx.db.patch(proposal._id, { status: "merged", decidedAt: Date.now() });
    return null;
  },
});

export const close = mutation({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || proposal.status !== "open") return null;
    const chapter = await ctx.db.get(proposal.chapterId);
    const book = chapter ? await ctx.db.get(chapter.bookId) : null;
    const mine = proposal.proposerId === userId;
    if (!mine && !(chapter && book && decides(chapter, book, userId))) throw new Error("Bu öneriyi kapatamazsın.");
    await ctx.db.patch(proposal._id, { status: "closed", decidedAt: Date.now() });
    return null;
  },
});

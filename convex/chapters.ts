import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireUserId } from "./users";
import { isOpenToBranches } from "./writingKinds";
import { canViewChapter, isMember, optionalUserId, viewableBook } from "./access";
import { snapshotBeforeChange, wordsIn } from "./versions";
import { recordDeskChange } from "./desk";
import { recordWriting } from "./goals";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type RichNode = { marks?: { type: string }[]; content?: RichNode[] };

function stripNotes(node: RichNode) {
  if (node.marks) {
    node.marks = node.marks.filter((mark) => mark.type !== "authorNote");
    if (node.marks.length === 0) delete node.marks;
  }
  node.content?.forEach(stripNotes);
}

// Author notes are the writer's private margin: they stay in the stored text
// but are removed before anyone else receives it.
export function withoutAuthorNotes(content: string): string {
  if (!content.includes('"authorNote"')) return content;
  try {
    const doc = JSON.parse(content) as RichNode;
    stripNotes(doc);
    return JSON.stringify(doc);
  } catch {
    return content;
  }
}

function forViewer(chapter: Doc<"chapters">, viewerId: Id<"users"> | null) {
  return chapter.authorId === viewerId
    ? chapter
    : { ...chapter, content: withoutAuthorNotes(chapter.content) };
}

async function assertCanBranch(
  ctx: MutationCtx,
  book: Doc<"books">,
  userId: Id<"users">,
  parentChapterId: Id<"chapters"> | undefined,
) {
  if (book.ownerId === userId) return;
  // Co-authors write in it as its owner does.
  if (await isMember(ctx, book._id, userId)) return;
  if (!isOpenToBranches(book)) {
    throw new Error("Bu yazıya yalnızca yazarı ekleme yapabilir.");
  }
  if (book.visibility !== "public") {
    throw new Error("Bu kitaba dal ekleyemezsin.");
  }
  if (parentChapterId === undefined) {
    throw new Error("Kök bölümü sadece kitabın sahibi yazabilir.");
  }
  const parent = await ctx.db.get(parentChapterId);
  if (!parent || parent.status !== "published") {
    throw new Error("Sadece yayınlanmış bir bölümden kendi dalını açabilirsin.");
  }
}

export const create = mutation({
  args: {
    bookId: v.id("books"),
    parentChapterId: v.optional(v.id("chapters")),
    title: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Kitap bulunamadı.");
    await assertCanBranch(ctx, book, userId, args.parentChapterId);

    const siblings = await ctx.db
      .query("chapters")
      .withIndex("by_book_and_parent", (q) =>
        q.eq("bookId", args.bookId).eq("parentChapterId", args.parentChapterId),
      )
      .collect();

    const now = Date.now();
    const words = wordsIn(args.content);
    const chapterId = await ctx.db.insert("chapters", {
      bookId: args.bookId,
      parentChapterId: args.parentChapterId,
      authorId: userId,
      title: args.title,
      content: args.content,
      order: siblings.length,
      isCanonical: siblings.length === 0,
      status: args.status,
      words,
      updatedAt: now,
      likeCount: 0,
      shareCount: 0,
      createdAt: now,
    });

    if (args.parentChapterId === undefined && book.rootChapterId === undefined) {
      await ctx.db.patch(args.bookId, { rootChapterId: chapterId });
    }
    await recordDeskChange(ctx, args.bookId, { _id: chapterId, authorId: userId }, {
      words,
      chapters: 1,
      touched: true,
    });
    await recordWriting(ctx, userId, words);

    return chapterId;
  },
});

export const get = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) return null;
    const userId = await optionalUserId(ctx);
    return (await canViewChapter(ctx, chapter, userId)) ? forViewer(chapter, userId) : null;
  },
});

export const listChildren = query({
  args: { bookId: v.id("books"), parentChapterId: v.optional(v.id("chapters")) },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if ((await viewableBook(ctx, args.bookId, userId)) === null) return [];
    const children = await ctx.db
      .query("chapters")
      .withIndex("by_book_and_parent", (q) =>
        q.eq("bookId", args.bookId).eq("parentChapterId", args.parentChapterId),
      )
      .order("asc")
      .take(200);
    return children
      .filter((c) => c.status === "published" || c.authorId === userId)
      .map((c) => forViewer(c, userId));
  },
});

export const getTree = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if ((await viewableBook(ctx, args.bookId, userId)) === null) return [];
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .take(500);
    return chapters
      .filter((c) => c.status === "published" || c.authorId === userId)
      .map((c) => forViewer(c, userId));
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("chapters")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .take(200);
  },
});

export const update = mutation({
  args: {
    chapterId: v.id("chapters"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter || chapter.authorId !== userId) {
      throw new Error("Bu bölümü düzenleyemezsin.");
    }
    const { chapterId, ...patch } = args;
    await snapshotBeforeChange(ctx, chapter, patch);
    const textChanged =
      (patch.content !== undefined && patch.content !== chapter.content) ||
      (patch.title !== undefined && patch.title !== chapter.title);
    const before = chapter.words ?? wordsIn(chapter.content);
    const after = patch.content !== undefined ? wordsIn(patch.content) : before;
    await ctx.db.patch(chapterId, {
      ...patch,
      words: after,
      ...(textChanged ? { updatedAt: Date.now() } : {}),
    });
    await recordDeskChange(ctx, chapter.bookId, chapter, {
      words: after - before,
      chapters: 0,
      touched: textChanged || patch.status !== undefined,
    });
    await recordWriting(ctx, userId, after - before);
    return null;
  },
});

export const hideBranch = mutation({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) throw new Error("Bölüm bulunamadı.");
    const book = await ctx.db.get(chapter.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Sadece kitabın sahibi bir dalı gizleyebilir.");
    }
    await ctx.db.patch(args.chapterId, { status: "draft" });
    return null;
  },
});

// Deletes one chapter. Its author or the book's owner may do it, but only for
// a chapter nothing continues from — deleting the middle of a story would
// orphan every branch below it.
export const remove = mutation({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) throw new Error("Bölüm bulunamadı.");
    const book = await ctx.db.get(chapter.bookId);
    if (chapter.authorId !== userId && book?.ownerId !== userId) {
      throw new Error("Bu bölümü silemezsin.");
    }
    const child = await ctx.db
      .query("chapters")
      .withIndex("by_book_and_parent", (q) =>
        q.eq("bookId", chapter.bookId).eq("parentChapterId", chapter._id),
      )
      .first();
    if (child !== null) {
      throw new Error("Bu bölümün devamı var; önce devamındaki bölümleri sil.");
    }

    await ctx.db.delete(chapter._id);

    if (book && book.rootChapterId === chapter._id) {
      await ctx.db.patch(book._id, { rootChapterId: undefined });
    }
    await recordDeskChange(ctx, chapter.bookId, chapter, {
      words: -(chapter.words ?? wordsIn(chapter.content)),
      chapters: -1,
      touched: false,
    });
    if (chapter.isCanonical) {
      const heir = await ctx.db
        .query("chapters")
        .withIndex("by_book_and_parent", (q) =>
          q.eq("bookId", chapter.bookId).eq("parentChapterId", chapter.parentChapterId),
        )
        .first();
      if (heir) await ctx.db.patch(heir._id, { isCanonical: true });
    }

    await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, {
      targetType: "chapter",
      targetId: chapter._id,
    });
    return { parentChapterId: chapter.parentChapterId ?? null };
  },
});

export const markCanonical = mutation({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) throw new Error("Bölüm bulunamadı.");
    const book = await ctx.db.get(chapter.bookId);
    if (!book || book.ownerId !== userId) {
      throw new Error("Sadece kitabın sahibi resmi hattı seçebilir.");
    }
    const siblings = await ctx.db
      .query("chapters")
      .withIndex("by_book_and_parent", (q) =>
        q.eq("bookId", chapter.bookId).eq("parentChapterId", chapter.parentChapterId),
      )
      .collect();
    for (const sibling of siblings) {
      if (sibling.isCanonical !== (sibling._id === chapter._id)) {
        await ctx.db.patch(sibling._id, {
          isCanonical: sibling._id === chapter._id,
        });
      }
    }
    return null;
  },
});

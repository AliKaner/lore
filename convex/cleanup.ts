import { internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Deleting a writing, chapter or entity (character, place…) removes the document right
// away; what hangs off it (likes, comments, reads, links…) is swept here in
// bounded batches that reschedule themselves until nothing is left.

const BATCH = 200;

type Sweepable = {
  _id: Id<
    | "likes"
    | "comments"
    | "shares"
    | "reports"
    | "favorites"
    | "chapterReads"
    | "bookEntities"
    | "entityLinks"
    | "boardItems"
    | "chapters"
    | "chapterVersions"
    | "eventEntities"
    | "events"
    | "planCards"
    | "bookMembers"
    | "proposals"
    | "dailyActivity"
  >;
};

async function sweep(ctx: MutationCtx, docs: Sweepable[]) {
  for (const doc of docs) await ctx.db.delete(doc._id);
  return docs.length === BATCH;
}

export const purgeTarget = internalMutation({
  args: {
    targetType: v.union(
      v.literal("book"),
      v.literal("chapter"),
      v.literal("entity"),
    ),
    targetId: v.string(),
  },
  handler: async (ctx, { targetType, targetId }) => {
    let more = false;

    if (targetType === "book" || targetType === "chapter") {
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      const shares = await ctx.db
        .query("shares")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      const reports = await ctx.db
        .query("reports")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      more = (await sweep(ctx, likes)) || more;
      more = (await sweep(ctx, comments)) || more;
      more = (await sweep(ctx, shares)) || more;
      more = (await sweep(ctx, reports)) || more;
    }

    if (targetType !== "chapter") {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_target", (q) =>
          q.eq("targetType", targetType).eq("targetId", targetId),
        )
        .take(BATCH);
      more = (await sweep(ctx, favorites)) || more;
    }

    if (targetType === "chapter") {
      const chapterId = ctx.db.normalizeId("chapters", targetId);
      if (chapterId !== null) {
        const reads = await ctx.db
          .query("chapterReads")
          .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
          .take(BATCH);
        more = (await sweep(ctx, reads)) || more;
        const versions = await ctx.db
          .query("chapterVersions")
          .withIndex("by_chapter_and_time", (q) => q.eq("chapterId", chapterId))
          .take(BATCH);
        more = (await sweep(ctx, versions)) || more;
        // Timeline events that pointed at it keep everything but the link.
        const told = await ctx.db
          .query("events")
          .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
          .take(BATCH);
        for (const event of told) await ctx.db.patch(event._id, { chapterId: undefined });
        more = told.length === BATCH || more;
        // Corkboard cards keep their text; suggestions go with the chapter.
        const cards = await ctx.db
          .query("planCards")
          .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
          .take(BATCH);
        for (const card of cards) await ctx.db.patch(card._id, { chapterId: undefined });
        more = cards.length === BATCH || more;
        const proposals = await ctx.db
          .query("proposals")
          .withIndex("by_chapter_and_status", (q) => q.eq("chapterId", chapterId))
          .take(BATCH);
        more = (await sweep(ctx, proposals)) || more;
      }
    }

    if (targetType === "entity") {
      const entityId = ctx.db.normalizeId("entities", targetId);
      if (entityId !== null) {
        const inBooks = await ctx.db
          .query("bookEntities")
          .withIndex("by_entity", (q) => q.eq("entityId", entityId))
          .take(BATCH);
        const outgoing = await ctx.db
          .query("entityLinks")
          .withIndex("by_from_and_role", (q) => q.eq("fromId", entityId))
          .take(BATCH);
        const incoming = await ctx.db
          .query("entityLinks")
          .withIndex("by_to", (q) => q.eq("toId", entityId))
          .take(BATCH);
        const pinned = await ctx.db
          .query("boardItems")
          .withIndex("by_entity", (q) => q.eq("entityId", entityId))
          .take(BATCH);
        more = (await sweep(ctx, pinned)) || more;
        more = (await sweep(ctx, inBooks)) || more;
        more = (await sweep(ctx, outgoing)) || more;
        more = (await sweep(ctx, incoming)) || more;
        const inEvents = await ctx.db
          .query("eventEntities")
          .withIndex("by_entity", (q) => q.eq("entityId", entityId))
          .take(BATCH);
        more = (await sweep(ctx, inEvents)) || more;
      }
    }

    if (more) {
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, {
        targetType,
        targetId,
      });
    }
    return null;
  },
});

// Removes every chapter of a deleted book (and schedules each chapter's own
// sweep), plus its links to the writer's entities.
export const purgeBook = internalMutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    for (const chapter of chapters) {
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, {
        targetType: "chapter",
        targetId: chapter._id,
      });
    }
    let more = await sweep(ctx, chapters);

    const entityLinks = await ctx.db
      .query("bookEntities")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    more = (await sweep(ctx, entityLinks)) || more;

    const boardItems = await ctx.db
      .query("boardItems")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    for (const item of boardItems) {
      if (item.storageId) await ctx.storage.delete(item.storageId);
    }
    more = (await sweep(ctx, boardItems)) || more;

    const cards = await ctx.db
      .query("planCards")
      .withIndex("by_book_and_order", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    more = (await sweep(ctx, cards)) || more;
    const members = await ctx.db
      .query("bookMembers")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    more = (await sweep(ctx, members)) || more;
    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_book_and_status", (q) => q.eq("bookId", bookId))
      .take(BATCH);
    more = (await sweep(ctx, proposals)) || more;

    // The writing's timeline events, with who took part in them.
    const events = await ctx.db
      .query("events")
      .withIndex("by_book", (q) => q.eq("bookId", bookId))
      .take(50);
    for (const event of events) {
      const rows = await ctx.db
        .query("eventEntities")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .take(BATCH);
      await sweep(ctx, rows);
    }
    more = (await sweep(ctx, events)) || events.length === 50 || more;

    if (more) {
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeBook, { bookId });
    }
    return null;
  },
});

// Sweeps a deleted account, a few kinds at a time, rescheduling itself until
// nothing of theirs is left. Their own writings go whole; a chapter of theirs
// in someone else's writing goes too, unless someone continued from it.
export const purgeUser = internalMutation({
  args: { userId: v.id("users"), chapterCursor: v.union(v.string(), v.null()) },
  handler: async (ctx, { userId, chapterCursor }) => {
    let more = false;

    const books = await ctx.db.query("books").withIndex("by_owner", (q) => q.eq("ownerId", userId)).take(20);
    for (const book of books) {
      if (book.coverStorageId) await ctx.storage.delete(book.coverStorageId);
      await ctx.db.delete(book._id);
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeBook, { bookId: book._id });
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, { targetType: "book", targetId: book._id });
    }
    more = books.length === 20 || more;

    const entities = await ctx.db.query("entities").withIndex("by_creator_and_kind", (q) => q.eq("creatorId", userId)).take(50);
    for (const entity of entities) {
      for (const image of entity.images) await ctx.storage.delete(image.storageId);
      await ctx.db.delete(entity._id);
      await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, { targetType: "entity", targetId: entity._id });
    }
    more = entities.length === 50 || more;

    const events = await ctx.db.query("events").withIndex("by_creator_and_year", (q) => q.eq("creatorId", userId)).take(50);
    for (const event of events) {
      await sweep(ctx, await ctx.db.query("eventEntities").withIndex("by_event", (q) => q.eq("eventId", event._id)).take(BATCH));
      await ctx.db.delete(event._id);
    }
    more = events.length === 50 || more;

    const board = await ctx.db.query("boardItems").withIndex("by_owner_and_book", (q) => q.eq("ownerId", userId)).take(BATCH);
    for (const item of board) if (item.storageId) await ctx.storage.delete(item.storageId);
    more = (await sweep(ctx, board)) || more;

    more = (await sweep(ctx, await ctx.db.query("comments").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH))) || more;
    more = (await sweep(ctx, await ctx.db.query("favorites").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH))) || more;
    more = (await sweep(ctx, await ctx.db.query("chapterReads").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH))) || more;
    more = (await sweep(ctx, await ctx.db.query("bookMembers").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH))) || more;
    more =
      (await sweep(ctx, await ctx.db.query("dailyActivity").withIndex("by_user_and_day", (q) => q.eq("userId", userId)).take(BATCH))) || more;

    // Likes come off the counts they added to.
    const likes = await ctx.db.query("likes").withIndex("by_user_and_target", (q) => q.eq("userId", userId)).take(BATCH);
    for (const like of likes) {
      const target =
        like.targetType === "book"
          ? await getBook(ctx, like.targetId)
          : await getChapter(ctx, like.targetId);
      if (target) await ctx.db.patch(target._id, { likeCount: Math.max(0, target.likeCount - 1) });
    }
    more = (await sweep(ctx, likes)) || more;

    // Chapters in other people's writings, a page at a time.
    let nextCursor = chapterCursor;
    if (chapterCursor !== "done") {
      const page = await ctx.db
        .query("chapters")
        .withIndex("by_author", (q) => q.eq("authorId", userId))
        .paginate({ cursor: chapterCursor, numItems: 50 });
      for (const chapter of page.page) {
        const book = await ctx.db.get(chapter.bookId);
        if (!book || book.ownerId === userId) continue;
        const child = await ctx.db
          .query("chapters")
          .withIndex("by_book_and_parent", (q) => q.eq("bookId", chapter.bookId).eq("parentChapterId", chapter._id))
          .first();
        if (child) continue;
        await ctx.db.delete(chapter._id);
        if (chapter.isCanonical) {
          const heir = await ctx.db
            .query("chapters")
            .withIndex("by_book_and_parent", (q) => q.eq("bookId", chapter.bookId).eq("parentChapterId", chapter.parentChapterId))
            .first();
          if (heir) await ctx.db.patch(heir._id, { isCanonical: true });
        }
        if (book.rootChapterId === chapter._id) await ctx.db.patch(book._id, { rootChapterId: undefined });
        await ctx.scheduler.runAfter(0, internal.cleanup.purgeTarget, { targetType: "chapter", targetId: chapter._id });
      }
      nextCursor = page.isDone ? "done" : page.continueCursor;
      more = !page.isDone || more;
    }

    if (more) await ctx.scheduler.runAfter(0, internal.cleanup.purgeUser, { userId, chapterCursor: nextCursor });
    return null;
  },
});

async function getBook(ctx: MutationCtx, id: string) {
  const bookId = ctx.db.normalizeId("books", id);
  return bookId ? await ctx.db.get(bookId) : null;
}

async function getChapter(ctx: MutationCtx, id: string) {
  const chapterId = ctx.db.normalizeId("chapters", id);
  return chapterId ? await ctx.db.get(chapterId) : null;
}

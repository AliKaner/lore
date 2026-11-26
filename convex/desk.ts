import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// The writer's desk numbers on a writing (words, chapters, last edit), kept
// up to date as the owner's own chapters change. Branches other readers
// write don't move the owner's desk.
export async function recordDeskChange(
  ctx: MutationCtx,
  bookId: Id<"books">,
  chapter: { _id: Id<"chapters">; authorId: Id<"users"> },
  change: { words: number; chapters: number; touched: boolean },
) {
  const book: Doc<"books"> | null = await ctx.db.get(bookId);
  if (!book || chapter.authorId !== book.ownerId) return;
  const patch: Partial<Doc<"books">> = {
    wordCount: Math.max(0, (book.wordCount ?? 0) + change.words),
    chapterCount: Math.max(0, (book.chapterCount ?? 0) + change.chapters),
  };
  if (change.touched) {
    patch.lastEditedAt = Date.now();
    patch.lastEditedChapterId = chapter._id;
  } else if (change.chapters < 0 && book.lastEditedChapterId === chapter._id) {
    patch.lastEditedChapterId = undefined;
  }
  await ctx.db.patch(book._id, patch);
}

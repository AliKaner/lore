import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

// A private writing (diary, journal, unshared draft) is visible only to its
// owner. Everything inside it — chapters, cast, comments — follows the book.
export function canViewBook(book: Doc<"books">, viewerId: Id<"users"> | null) {
  return book.visibility === "public" || book.ownerId === viewerId;
}

// Whether someone writes this writing together with its owner.
export async function isMember(ctx: QueryCtx, bookId: Id<"books">, userId: Id<"users"> | null) {
  if (userId === null) return false;
  const row = await ctx.db
    .query("bookMembers")
    .withIndex("by_book_and_user", (q) => q.eq("bookId", bookId).eq("userId", userId))
    .unique();
  return row !== null;
}

// The owner and the co-authors may write in a writing.
export async function canWriteBook(ctx: QueryCtx, book: Doc<"books">, userId: Id<"users"> | null) {
  if (userId === null) return false;
  return book.ownerId === userId || (await isMember(ctx, book._id, userId));
}

// Co-authors see a private writing as its owner does.
export async function viewableBook(
  ctx: QueryCtx,
  bookId: Id<"books">,
  viewerId: Id<"users"> | null,
) {
  const book = await ctx.db.get(bookId);
  if (book === null) return null;
  if (canViewBook(book, viewerId)) return book;
  return (await isMember(ctx, bookId, viewerId)) ? book : null;
}

// Whether the viewer may see a chapter: its book must be visible, and a draft
// only to whoever wrote it. A branch author keeps access to their own text
// even if the book later turns private.
export async function canViewChapter(
  ctx: QueryCtx,
  chapter: Doc<"chapters">,
  viewerId: Id<"users"> | null,
) {
  if (chapter.authorId === viewerId) return true;
  if (chapter.status !== "published") return false;
  return (await viewableBook(ctx, chapter.bookId, viewerId)) !== null;
}

export async function optionalUserId(ctx: QueryCtx) {
  return await getAuthUserId(ctx);
}

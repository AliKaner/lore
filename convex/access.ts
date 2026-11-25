import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

// A private writing (diary, journal, unshared draft) is visible only to its
// owner. Everything inside it — chapters, cast, comments — follows the book.
export function canViewBook(book: Doc<"books">, viewerId: Id<"users"> | null) {
  return book.visibility === "public" || book.ownerId === viewerId;
}

export async function viewableBook(
  ctx: QueryCtx,
  bookId: Id<"books">,
  viewerId: Id<"users"> | null,
) {
  const book = await ctx.db.get(bookId);
  return book !== null && canViewBook(book, viewerId) ? book : null;
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

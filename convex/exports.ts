import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { optionalUserId } from "./access";
import { components } from "./_generated/api";

type Chapter = Doc<"chapters">;

// Everything a writer needs to take a writing with them: the book and its
// chapters in reading order (depth-first, the main line first at every
// fork), each marked with its depth and whether it is on the main line.
// Only the owner may export; others' drafts in the book are left out.
export const bookForExport = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    const book = await ctx.db.get(args.bookId);
    if (!book || userId === null || book.ownerId !== userId) return null;

    const all = await ctx.db
      .query("chapters")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .take(1000);
    const visible = all.filter((c) => c.status === "published" || c.authorId === userId);

    const children = new Map<string, Chapter[]>();
    for (const chapter of visible) {
      const key = chapter.parentChapterId ?? "root";
      const list = children.get(key) ?? [];
      list.push(chapter);
      children.set(key, list);
    }
    for (const list of children.values()) {
      list.sort((a, b) =>
        a.isCanonical === b.isCanonical ? a.order - b.order : a.isCanonical ? -1 : 1,
      );
    }

    const ordered: {
      _id: Id<"chapters">;
      title: string;
      content: string;
      status: "draft" | "published";
      depth: number;
      onMainLine: boolean;
      byOwner: boolean;
    }[] = [];
    const walk = (parent: string, depth: number, mainLine: boolean) => {
      for (const chapter of children.get(parent) ?? []) {
        const onMainLine = mainLine && chapter.isCanonical;
        ordered.push({
          _id: chapter._id,
          title: chapter.title,
          content: chapter.content,
          status: chapter.status,
          depth,
          onMainLine,
          byOwner: chapter.authorId === userId,
        });
        walk(chapter._id, depth + 1, onMainLine);
      }
    };
    walk("root", 0, true);

    // For the e-book: who wrote it and its cover.
    const author: string | null = await ctx.runQuery(components.authUsername.public.getUsername, { userId });
    const coverUrl = book.coverStorageId ? await ctx.storage.getUrl(book.coverStorageId) : null;

    return {
      book: {
        _id: book._id,
        title: book.title,
        description: book.description,
        kind: book.kind ?? "book",
        visibility: book.visibility,
        createdAt: book.createdAt,
        language: book.language ?? null,
        author,
        coverUrl,
      },
      chapters: ordered,
    };
  },
});

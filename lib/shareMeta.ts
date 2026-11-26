import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { KINDS } from "@/lib/writingKinds";

// What a shared link shows in WhatsApp, X, Telegram…: the writing's title,
// kind and author. Only open writings are found; a private one (or a broken
// link) gets the site's own card.

function plainText(content: string, max = 180) {
  let text = content;
  try {
    const walk = (node: { text?: string; content?: unknown[] }): string =>
      (node.text ?? "") + (node.content ?? []).map((child) => walk(child as typeof node)).join(" ");
    text = walk(JSON.parse(content));
  } catch {
    text = content.replace(/<[^>]+>/gu, " ");
  }
  const flat = text.replace(/\s+/gu, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

export async function bookForShare(bookId: string) {
  try {
    const book = await fetchQuery(api.books.get, { bookId: bookId as Id<"books"> });
    if (!book || book.visibility !== "public") return null;
    const author = await fetchQuery(api.users.publicProfile, { userId: book.ownerId }).catch(() => null);
    return {
      title: book.title,
      description: book.description ?? null,
      kind: KINDS[book.kind ?? "book"].label,
      author: author?.username ?? null,
    };
  } catch {
    return null;
  }
}

export async function chapterForShare(chapterId: string) {
  try {
    const chapter = await fetchQuery(api.chapters.get, { chapterId: chapterId as Id<"chapters"> });
    if (!chapter || chapter.status !== "published") return null;
    return { title: chapter.title, excerpt: plainText(chapter.content) };
  } catch {
    return null;
  }
}

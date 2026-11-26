import { query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { optionalUserId } from "./access";

// How a chapter's earlier states are kept:
// - before an edit overwrites the text, the old text is saved, but at most
//   once every SNAPSHOT_GAP (autosave runs every few seconds, and one
//   version per keystroke pause would be noise);
// - publishing always saves the state it replaces;
// - only the last MAX_VERSIONS per chapter are kept.
export const SNAPSHOT_GAP_MS = 10 * 60 * 1000;
export const MAX_VERSIONS = 50;

type JsonNode = { type?: string; text?: string; content?: JsonNode[] };

export function wordsIn(content: string): number {
  let text = "";
  try {
    const walk = (node: JsonNode) => {
      if (node.type === "text") text += node.text ?? "";
      node.content?.forEach(walk);
      if (node.type === "paragraph" || node.type === "heading") text += " ";
    };
    walk(JSON.parse(content) as JsonNode);
  } catch {
    text = content.replace(/<[^>]+>/g, " ");
  }
  const words = text.trim().split(/\s+/u);
  return words[0] === "" ? 0 : words.length;
}

export async function snapshotBeforeChange(
  ctx: MutationCtx,
  chapter: Doc<"chapters">,
  next: { title?: string; content?: string; status?: "draft" | "published" },
) {
  const changesText =
    (next.content !== undefined && next.content !== chapter.content) ||
    (next.title !== undefined && next.title !== chapter.title);
  if (!changesText) return;

  const publishing = next.status === "published";
  const latest = await ctx.db
    .query("chapterVersions")
    .withIndex("by_chapter_and_time", (q) => q.eq("chapterId", chapter._id))
    .order("desc")
    .first();
  const now = Date.now();
  if (!publishing && latest && now - latest.createdAt < SNAPSHOT_GAP_MS) return;

  await ctx.db.insert("chapterVersions", {
    chapterId: chapter._id,
    authorId: chapter.authorId,
    title: chapter.title,
    content: chapter.content,
    words: wordsIn(chapter.content),
    reason: publishing ? "publish" : "edit",
    createdAt: now,
  });

  const overflow = await ctx.db
    .query("chapterVersions")
    .withIndex("by_chapter_and_time", (q) => q.eq("chapterId", chapter._id))
    .order("desc")
    .take(MAX_VERSIONS + 5);
  for (const old of overflow.slice(MAX_VERSIONS)) await ctx.db.delete(old._id);
}

// The list for the history drawer: newest first, without the full text.
export const list = query({
  args: { chapterId: v.id("chapters") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter || userId === null || chapter.authorId !== userId) return [];
    const versions = await ctx.db
      .query("chapterVersions")
      .withIndex("by_chapter_and_time", (q) => q.eq("chapterId", args.chapterId))
      .order("desc")
      .take(MAX_VERSIONS);
    return versions.map(({ _id, title, words, reason, createdAt }) => ({
      _id,
      title,
      words,
      reason,
      createdAt,
    }));
  },
});

// One version's full text, for previewing and bringing it back.
export const get = query({
  args: { versionId: v.id("chapterVersions") },
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    const version = await ctx.db.get(args.versionId);
    if (!version || userId === null || version.authorId !== userId) return null;
    return version;
  },
});

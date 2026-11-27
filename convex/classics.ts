import { internalAction, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { bookLanguageValidator, writingKindValidator } from "./writingKinds";
import { recordDeskChange } from "./desk";
import { wordsIn } from "./versions";
import {
  parseStandardEbooksChapter,
  parseWikisource,
  splitByWords,
  standardEbooksChapters,
  toDoc,
  type ChapterDoc,
} from "./classicsParse";

// Public-domain books from open libraries, chapter by chapter, owned by the
// account that brings them in (so they can be split or fixed by hand),
// public, and open for anyone to branch from. Run from the command line:
//   npx convex run classics:importWikisource '{"owner":"…","pages":["…"],…}'
//   npx convex run classics:importStandardEbooks '{"owner":"…","repo":"…",…}'

const USER_AGENT = "BooktionClassicsImporter/1.0 (public-domain library import)";

const classicValidator = v.object({
  author: v.string(),
  year: v.optional(v.string()),
  source: v.string(),
  sourceUrl: v.string(),
  license: v.string(),
});

export const createBook = internalMutation({
  args: {
    ownerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    kind: writingKindValidator,
    language: bookLanguageValidator,
    classic: classicValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("books")
      .withIndex("by_classic_author", (q) => q.eq("classic.author", args.classic.author))
      .take(500);
    if (existing.some((b) => b.title === args.title)) throw new Error(`Zaten var: ${args.title}`);
    return await ctx.db.insert("books", {
      title: args.title,
      description: args.description,
      ownerId: args.ownerId,
      kind: args.kind,
      language: args.language,
      classic: args.classic,
      visibility: "public",
      likeCount: 0,
      shareCount: 0,
      createdAt: Date.now(),
    });
  },
});

// One more chapter at the end of the main line.
export const addChapter = internalMutation({
  args: {
    bookId: v.id("books"),
    parentChapterId: v.optional(v.id("chapters")),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Kitap yok.");
    const now = Date.now();
    const words = wordsIn(args.content);
    const chapterId = await ctx.db.insert("chapters", {
      bookId: book._id,
      parentChapterId: args.parentChapterId,
      authorId: book.ownerId,
      title: args.title,
      content: args.content,
      order: 0,
      isCanonical: true,
      status: "published",
      words,
      updatedAt: now,
      likeCount: 0,
      shareCount: 0,
      createdAt: now,
    });
    if (args.parentChapterId === undefined) await ctx.db.patch(book._id, { rootChapterId: chapterId });
    await recordDeskChange(ctx, book._id, { _id: chapterId, authorId: book.ownerId }, { words, chapters: 1, touched: true });
    return chapterId;
  },
});

async function ownerId(ctx: { runQuery: (ref: never, args: never) => Promise<unknown> }, username: string) {
  const id = (await ctx.runQuery(
    components.authUsername.public.getUserIdByUsername as never,
    { username } as never,
  )) as Id<"users"> | null;
  if (id === null) throw new Error(`Kullanıcı yok: ${username}`);
  return id;
}

// Open libraries ask clients to go slowly; one request every second or so.
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// When a library says "too many requests", wait as long as it asks (or a
// while) and try again, a few times.
async function fetchText(url: string) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) return await res.text();
    if (res.status !== 429 || attempt >= 4) throw new Error(`${res.status} ${url}`);
    const wait = Number(res.headers.get("retry-after")) || 15 * (attempt + 1);
    await pause(Math.min(wait, 60) * 1000);
  }
}

async function wikisourceHtml(page: string) {
  const url = new URL("https://tr.wikisource.org/w/api.php");
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", page);
  url.searchParams.set("prop", "text");
  url.searchParams.set("format", "json");
  url.searchParams.set("redirects", "1");
  const data = JSON.parse(await fetchText(url.toString())) as { parse?: { text: { "*": string } }; error?: { info: string } };
  if (!data.parse) throw new Error(`${page}: ${data.error?.info ?? "bulunamadı"}`);
  return data.parse.text["*"];
}

const wikiUrl = (page: string) => `https://tr.wikisource.org/wiki/${encodeURIComponent(page.replace(/ /gu, "_"))}`;

async function addAll(
  ctx: { runMutation: (ref: never, args: never) => Promise<unknown> },
  bookId: Id<"books">,
  chapters: { title: string; doc: ChapterDoc }[],
) {
  let parent: Id<"chapters"> | undefined = undefined;
  for (const chapter of chapters) {
    parent = (await ctx.runMutation(
      internal.classics.addChapter as never,
      { bookId, parentChapterId: parent, title: chapter.title, content: JSON.stringify(chapter.doc) } as never,
    )) as Id<"chapters">;
  }
  return chapters.length;
}

// One Vikikaynak page split into parts (a novel), or several pages as the
// chapters of one book (a collection of stories). Every page must be by the
// named author, so nothing is credited wrongly.
export const importWikisource = internalAction({
  args: {
    owner: v.string(),
    author: v.string(),
    pages: v.array(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    kind: writingKindValidator,
    splitWords: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx as never, args.owner);
    const parsed: ReturnType<typeof parseWikisource>[] = [];
    // A page that isn't clearly by the author, or has no plain text, is left
    // out (and reported) rather than credited wrongly or shown empty.
    const skipped: string[] = [];
    for (const [i, page] of args.pages.entries()) {
      if (i > 0) await pause(3000);
      try {
        const result = parseWikisource(await wikisourceHtml(page), page);
        if (result.author !== args.author) skipped.push(`${page}: yazarı "${result.author}"`);
        else if (result.paragraphs.length === 0) skipped.push(`${page}: metin bulunamadı`);
        else parsed.push(result);
      } catch (error) {
        skipped.push(`${page}: ${String(error)}`);
      }
    }
    if (parsed.length === 0) throw new Error(`Hiçbir sayfa alınamadı: ${skipped.join("; ")}`);
    const single = args.pages.length === 1;
    const chapters = single
      ? splitByWords(parsed[0].paragraphs, args.splitWords ?? 3000).map((part, i, all) => ({
          title: all.length === 1 ? parsed[0].title : `Bölüm ${i + 1}`,
          doc: toDoc(part),
        }))
      : parsed.map((p) => ({ title: p.title, doc: toDoc(p.paragraphs) }));
    const bookId = (await ctx.runMutation(internal.classics.createBook, {
      ownerId: owner,
      title: args.title ?? parsed[0].title,
      description: args.description,
      kind: args.kind,
      language: "tr",
      classic: {
        author: args.author,
        year: single ? (parsed[0].year ?? undefined) : undefined,
        source: "Vikikaynak",
        sourceUrl: wikiUrl(single ? args.pages[0] : `Kişi:${args.author}`),
        license: "Kamu malı; Vikikaynak metni CC BY-SA 4.0",
      },
    })) as Id<"books">;
    const count = await addAll(ctx as never, bookId, chapters);
    return { bookId, chapters: count, skipped };
  },
});

// A Standard Ebooks book from its source repository on GitHub, one chapter
// per file of its table of contents.
export const importStandardEbooks = internalAction({
  args: {
    owner: v.string(),
    repo: v.string(),
    title: v.string(),
    author: v.string(),
    year: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx as never, args.owner);
    const base = `https://raw.githubusercontent.com/standardebooks/${args.repo}/master/src/epub`;
    const files = standardEbooksChapters(await fetchText(`${base}/toc.xhtml`));
    if (files.length === 0) throw new Error("İçindekiler boş.");
    const chapters = [];
    for (const file of files) {
      await pause(300);
      const chapter = parseStandardEbooksChapter(await fetchText(`${base}/text/${file}`), "en");
      if (chapter.paragraphs.length > 0) chapters.push({ title: chapter.title, doc: toDoc(chapter.paragraphs) });
    }
    const bookId = (await ctx.runMutation(internal.classics.createBook, {
      ownerId: owner,
      title: args.title,
      description: args.description,
      kind: "book",
      language: "en",
      classic: {
        author: args.author,
        year: args.year,
        source: "Standard Ebooks",
        sourceUrl: `https://standardebooks.org/ebooks/${args.repo.replace("_", "/")}`,
        license: "Kamu malı; Standard Ebooks baskısı CC0",
      },
    })) as Id<"books">;
    const count = await addAll(ctx as never, bookId, chapters);
    return { bookId, chapters: count };
  },
});

// Takes a classic off the shelf (with its chapters and everything on them),
// to bring it in again: npx convex run classics:removeBook '{"bookId":"…"}'
export const removeBook = internalMutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book?.classic) throw new Error("Bu bir klasik değil.");
    await ctx.db.delete(book._id);
    await ctx.scheduler.runAfter(0, internal.cleanup.purgeBook, { bookId: book._id });
    return null;
  },
});

// The classics shelf, for anyone.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_classic_author", (q) => q.gt("classic.author", ""))
      .take(300);
    return books
      .filter((b) => b.visibility === "public" && b.classic && b.rootChapterId)
      .map((b) => ({
        _id: b._id,
        title: b.title,
        description: b.description ?? null,
        coverStorageId: b.coverStorageId ?? null,
        language: b.language ?? "tr",
        author: b.classic!.author,
        year: b.classic!.year ?? null,
        rootChapterId: b.rootChapterId!,
        chapters: b.chapterCount ?? 0,
        words: b.wordCount ?? 0,
      }));
  },
});

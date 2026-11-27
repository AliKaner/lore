import { internalAction, internalMutation, internalQuery, query, type MutationCtx } from "./_generated/server";
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

// Public-domain books from open libraries, chapter by chapter, public, and
// open for anyone to branch from. Each belongs to an account standing for
// its author (@sabahattinali, @janeausten…), not to whoever imported it.
// Run from the command line:
//   npx convex run classics:importWikisource '{"pages":["…"],…}'
//   npx convex run classics:importStandardEbooks '{"repo":"…",…}'

const USER_AGENT = "BooktionClassicsImporter/1.0 (public-domain library import)";

const classicValidator = v.object({
  author: v.string(),
  year: v.optional(v.string()),
  source: v.string(),
  sourceUrl: v.string(),
  license: v.string(),
  coverCredit: v.optional(v.string()),
});

// "Sabahattin Ali" → "sabahattinali": a username made of plain letters.
export function authorHandle(author: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  const plain = author
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıİöşüâîû]/gu, (ch) => map[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[^a-z0-9]/gu, "");
  return plain.slice(0, 30) || "yazar";
}

// The account that stands for a classic author, made the first time.
async function authorAccount(ctx: MutationCtx, author: string): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_classic_author", (q) => q.eq("classicAuthor", author))
    .unique();
  if (existing) return existing._id;
  const userId = await ctx.db.insert("users", {
    xp: 0,
    level: 1,
    classicAuthor: author,
    bio: "Klasik yazar. Eserleri kamu malı: oku, istediğin bölümden kendi dalını yaz.",
  });
  const handle = authorHandle(author);
  for (let n = 0; n < 20; n++) {
    try {
      await ctx.runMutation(components.authUsername.public.setUsername, { userId, username: n === 0 ? handle : `${handle}${n + 1}` });
      break;
    } catch {
      // Taken; try the next.
    }
  }
  return userId;
}

export const createBook = internalMutation({
  args: {
    ownerId: v.optional(v.id("users")),
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
      ownerId: args.ownerId ?? (await authorAccount(ctx, args.classic.author)),
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
    // Only to put the book in someone's own account instead of the author's.
    owner: v.optional(v.string()),
    author: v.string(),
    pages: v.array(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    kind: writingKindValidator,
    splitWords: v.optional(v.number()),
    // A book of poems: line breaks are kept inside each stanza.
    poetry: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const owner = args.owner ? await ownerId(ctx as never, args.owner) : undefined;
    const parsed: ReturnType<typeof parseWikisource>[] = [];
    // A page that isn't clearly by the author, or has no plain text, is left
    // out (and reported) rather than credited wrongly or shown empty.
    const skipped: string[] = [];
    for (const [i, page] of args.pages.entries()) {
      if (i > 0) await pause(3000);
      try {
        const result = parseWikisource(await wikisourceHtml(page), page, args.poetry ?? false);
        if (result.author !== args.author) skipped.push(`${page}: yazarı "${result.author}"`);
        else if (result.paragraphs.length === 0) skipped.push(`${page}: metin bulunamadı`);
        else parsed.push({ ...result, title: page.includes("/") && (!result.title || page.startsWith(`${result.title}/`)) ? page.slice(page.lastIndexOf("/") + 1) : result.title });
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
      ...(owner ? { ownerId: owner } : {}),
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
    // Only to put the book in someone's own account instead of the author's.
    owner: v.optional(v.string()),
    repo: v.string(),
    title: v.string(),
    author: v.string(),
    year: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = args.owner ? await ownerId(ctx as never, args.owner) : undefined;
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
      ...(owner ? { ownerId: owner } : {}),
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

// A public-domain picture as a classic's cover, with its credit:
//   npx convex run classics:setCover '{"bookId":"…","imageUrl":"…","credit":"…"}'
export const setCover = internalAction({
  args: { bookId: v.id("books"), imageUrl: v.string(), credit: v.string() },
  handler: async (ctx, args) => {
    const res = await fetch(args.imageUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`${res.status} ${args.imageUrl}`);
    const type = (res.headers.get("content-type") ?? "").split(";")[0];
    if (!type.startsWith("image/")) throw new Error(`Görsel değil: ${type}`);
    const storageId = await ctx.storage.store(new Blob([await res.arrayBuffer()], { type }));
    await ctx.runMutation(internal.classics.attachCover, { bookId: args.bookId, storageId, credit: args.credit });
    return storageId;
  },
});

export const attachCover = internalMutation({
  args: { bookId: v.id("books"), storageId: v.id("_storage"), credit: v.string() },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book?.classic) throw new Error("Bu bir klasik değil.");
    if (book.coverStorageId) await ctx.storage.delete(book.coverStorageId);
    await ctx.db.patch(book._id, { coverStorageId: args.storageId, classic: { ...book.classic, coverCredit: args.credit } });
    return null;
  },
});

// Moves a classic from whoever imported it to its author's account, with
// the chapters that importer held (branches others wrote stay theirs).
export const moveToAuthor = internalMutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const book = await ctx.db.get(args.bookId);
    if (!book?.classic) throw new Error("Bu bir klasik değil.");
    const author = await authorAccount(ctx, book.classic.author);
    if (book.ownerId === author) return { moved: 0, done: true };
    // A few chapters at a time: each one is a whole text to write again.
    let moved = 0;
    for await (const chapter of ctx.db.query("chapters").withIndex("by_book", (q) => q.eq("bookId", book._id))) {
      if (chapter.authorId !== book.ownerId) continue;
      await ctx.db.patch(chapter._id, { authorId: author });
      moved += 1;
      if (moved >= 8) return { moved, done: false };
    }
    await ctx.db.patch(book._id, { ownerId: author });
    return { moved, done: true };
  },
});

// Every classic on the shelf to its author's account, slowly enough for
// the deployment's write limit:
//   npx convex run classics:moveAllToAuthors
export const moveAllToAuthors = internalAction({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.runQuery(internal.classics.allClassicIds, {});
    const out: string[] = [];
    for (const bookId of books) {
      let total = 0;
      for (let round = 0; round < 500; round++) {
        const { moved, done } = await ctx.runMutation(internal.classics.moveToAuthor, { bookId });
        total += moved;
        if (done) break;
        await pause(1500);
      }
      out.push(`${bookId}: ${total}`);
      await pause(1000);
    }
    return out;
  },
});

export const allClassicIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_classic_author", (q) => q.gt("classic.author", ""))
      .take(500);
    return books.map((b) => b._id);
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
        kind: b.kind ?? "book",
        chapters: b.chapterCount ?? 0,
        words: b.wordCount ?? 0,
      }));
  },
});

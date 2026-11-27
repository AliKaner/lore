// Turning pages from open libraries into chapters: Vikikaynak (MediaWiki
// HTML) and Standard Ebooks (clean XHTML). Plain functions, no DOM, so they
// run in a Convex action and in tests alike.

type Mark = { type: "italic" };
type TextNode = { type: "text"; text: string; marks?: Mark[] };
type Paragraph = { type: "paragraph"; content?: TextNode[] };
export type ChapterDoc = { type: "doc"; content: Paragraph[] };

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

export function decode(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/giu, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/gu, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/giu, (whole, name: string) => ENTITIES[name.toLowerCase()] ?? whole);
}

// One paragraph's inner HTML as text runs, keeping italics.
export function inlineRuns(html: string): TextNode[] {
  const runs: TextNode[] = [];
  let italic = 0;
  for (const part of html.split(/(<[^>]+>)/u)) {
    if (!part) continue;
    if (part.startsWith("<")) {
      const tag = /^<\/?\s*([a-z0-9]+)/iu.exec(part)?.[1]?.toLowerCase();
      if (tag === "i" || tag === "em") italic += part.startsWith("</") ? -1 : 1;
      continue;
    }
    const text = decode(part).replace(/[\s ]+/gu, " ");
    if (!text) continue;
    const last = runs[runs.length - 1];
    const marks: Mark[] | undefined = italic > 0 ? [{ type: "italic" }] : undefined;
    if (last && !!last.marks === !!marks) last.text += text;
    else runs.push(marks ? { type: "text", text, marks } : { type: "text", text });
  }
  // Trim the paragraph's ends (a run of only spaces may sit before the text).
  while (runs.length > 0 && !runs[0].text.trim()) runs.shift();
  while (runs.length > 0 && !runs[runs.length - 1].text.trim()) runs.pop();
  if (runs[0]) runs[0].text = runs[0].text.replace(/^\s+/u, "");
  const end = runs[runs.length - 1];
  if (end) end.text = end.text.replace(/\s+$/u, "");
  return runs.filter((r) => r.text.length > 0);
}

const wordsOf = (p: Paragraph) =>
  (p.content ?? []).map((r) => r.text).join("").trim().split(/\s+/u).filter(Boolean).length;

export function toDoc(paragraphs: Paragraph[]): ChapterDoc {
  return { type: "doc", content: paragraphs };
}

export function docWords(doc: ChapterDoc) {
  return doc.content.reduce((sum, p) => sum + wordsOf(p), 0);
}

// The `<p>` paragraphs of an HTML fragment, empty ones dropped. Some
// sources break paragraphs with `<br>` inside one `<p>`; those become
// paragraphs of their own.
export function paragraphsOf(html: string): Paragraph[] {
  const out: Paragraph[] = [];
  for (const match of html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/giu)) {
    for (const piece of match[1].split(/<br\s*\/?>/iu)) {
      const runs = inlineRuns(piece);
      if (runs.length > 0) out.push({ type: "paragraph", content: runs });
    }
  }
  return out;
}

/* ---------- Vikikaynak ---------- */

export type WikiPage = { title: string; author: string | null; year: string | null; paragraphs: Paragraph[] };

// The parsed HTML of a Vikikaynak page: the header gives title, author and
// year; the text is the paragraphs after it (navigation boxes, notes and
// license footers are left out).
export function parseWikisource(html: string, fallbackTitle: string): WikiPage {
  const title = decode(/id="header_title_text">([\s\S]*?)<\/span>/u.exec(html.replace(/&#95;/gu, "_"))?.[1] ?? fallbackTitle)
    .replace(/<[^>]+>/gu, "")
    .trim();
  const clean = html.replace(/&#95;/gu, "_");
  const author = /id="header_author_text"[^>]*>(?:<span[^>]*>)?([\s\S]*?)<\/span>/u.exec(clean)?.[1]?.replace(/<[^>]+>/gu, "").trim() ?? null;
  const year = /<\/span><\/b>\s*(?:&#160;|\s)*\((\d{3,4})\)/u.exec(clean)?.[1] ?? null;
  // Everything after the header box; drop references, tables and boxes.
  const body = clean
    .replace(/<div id="headerContainer"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/u, "")
    .replace(/<table[\s\S]*?<\/table>/gu, "")
    .replace(/<sup[\s\S]*?<\/sup>/gu, "")
    .replace(/<ol class="references"[\s\S]*?<\/ol>/gu, "")
    .replace(/<div class="(?:licenseContainer|ws-noexport|noprint)[\s\S]*$/u, "");
  return { title: title || fallbackTitle, author: author ? decode(author).replace(/[^\p{L}\s.'-]/gu, "").trim() || null : null, year, paragraphs: paragraphsOf(body) };
}

// A long text with no chapters of its own, cut at paragraph ends into parts
// of about `target` words.
export function splitByWords(paragraphs: Paragraph[], target = 3000): Paragraph[][] {
  const parts: Paragraph[][] = [];
  let current: Paragraph[] = [];
  let words = 0;
  for (const p of paragraphs) {
    current.push(p);
    words += wordsOf(p);
    if (words >= target) {
      parts.push(current);
      current = [];
      words = 0;
    }
  }
  if (current.length > 0) {
    // A short tail joins the part before it.
    if (parts.length > 0 && words < target / 3) parts[parts.length - 1].push(...current);
    else parts.push(current);
  }
  return parts;
}

/* ---------- Standard Ebooks ---------- */

// The chapter files listed in a book's table of contents, in order.
export function standardEbooksChapters(toc: string): string[] {
  const files: string[] = [];
  for (const match of toc.matchAll(/href="text\/([^"#]+\.xhtml)"/gu)) {
    const file = match[1];
    if (/^(titlepage|imprint|colophon|uncopyright|halftitlepage|dedication|epigraph|endnotes|loi|preface|introduction|foreword|acknowledgements)/u.test(file)) continue;
    if (!files.includes(file)) files.push(file);
  }
  return files;
}

export function parseStandardEbooksChapter(xhtml: string, lang: "tr" | "en") {
  const raw = /<title>([\s\S]*?)<\/title>/u.exec(xhtml)?.[1] ?? "";
  const title = decode(raw.replace(/<[^>]+>/gu, "")).trim();
  const body = /<body[\s\S]*?>([\s\S]*)<\/body>/u.exec(xhtml)?.[1] ?? xhtml;
  // A bare roman numeral reads better as "Chapter IV".
  const named = /^[IVXLCDM]+$/u.test(title) ? `${lang === "tr" ? "Bölüm" : "Chapter"} ${title}` : title;
  return { title: named, paragraphs: paragraphsOf(body) };
}

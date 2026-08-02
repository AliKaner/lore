"use client";

import React from "react";
import Link from "next/link";

export type HighlightEntry = { id: string; name: string };

const COLOR_PALETTE: Record<string, string> = {
  red: "#f87171",
  orange: "#fb923c",
  amber: "#fbbf24",
  yellow: "#facc15",
  green: "#4ade80",
  emerald: "#34d399",
  teal: "#2dd4bf",
  cyan: "#22d3ee",
  sky: "#38bdf8",
  blue: "#60a5fa",
  indigo: "#818cf8",
  violet: "#a78bfa",
  purple: "#c084fc",
  pink: "#f472b6",
  rose: "#fb7185",
  gray: "#9ca3af",
  white: "#f8fafc",
};

/** Exposed for the editor toolbar so its swatches stay in sync with what actually renders. */
export const RICH_TEXT_COLORS: { name: string; label: string; hex: string }[] = [
  { name: "red", label: "Kırmızı", hex: COLOR_PALETTE.red },
  { name: "orange", label: "Turuncu", hex: COLOR_PALETTE.orange },
  { name: "amber", label: "Kehribar", hex: COLOR_PALETTE.amber },
  { name: "yellow", label: "Sarı", hex: COLOR_PALETTE.yellow },
  { name: "green", label: "Yeşil", hex: COLOR_PALETTE.green },
  { name: "emerald", label: "Zümrüt", hex: COLOR_PALETTE.emerald },
  { name: "teal", label: "Turkuaz", hex: COLOR_PALETTE.teal },
  { name: "sky", label: "Gök Mavisi", hex: COLOR_PALETTE.sky },
  { name: "blue", label: "Mavi", hex: COLOR_PALETTE.blue },
  { name: "indigo", label: "Çivit", hex: COLOR_PALETTE.indigo },
  { name: "violet", label: "Menekşe", hex: COLOR_PALETTE.violet },
  { name: "purple", label: "Mor", hex: COLOR_PALETTE.purple },
  { name: "pink", label: "Pembe", hex: COLOR_PALETTE.pink },
  { name: "rose", label: "Gül", hex: COLOR_PALETTE.rose },
  { name: "gray", label: "Gri", hex: COLOR_PALETTE.gray },
  { name: "white", label: "Beyaz", hex: COLOR_PALETTE.white },
];

export const RICH_TEXT_FONTS: { name: string; label: string }[] = [
  { name: "title", label: "Başlık Fontu" },
  { name: "text", label: "Metin Fontu" },
  { name: "serif", label: "Serif" },
  { name: "sans", label: "Sans" },
  { name: "mono", label: "Daktilo (Mono)" },
];

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function resolveColor(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (COLOR_PALETTE[value]) return COLOR_PALETTE[value];
  if (HEX_PATTERN.test(raw.trim())) return raw.trim();
  return null;
}

const FONT_CLASSES: Record<string, string> = {
  title: "font-title",
  text: "font-text",
  serif: "font-serif",
  sans: "font-sans",
  mono: "font-mono",
};

function resolveFontClass(raw: string): string | null {
  return FONT_CLASSES[raw.trim().toLowerCase()] ?? null;
}

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  return /^(https?:|mailto:)/i.test(trimmed);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const WORD_CHAR = "A-Za-z0-9_ÇĞİIıÖŞÜçğıöşü";

function highlightPlainText(text: string, entries: HighlightEntry[], keyPrefix: string): React.ReactNode {
  if (!entries.length || !text) return text;
  const byLower = new Map<string, HighlightEntry>();
  for (const e of entries) {
    if (e.name.trim()) byLower.set(e.name.toLowerCase(), e);
  }
  const names = Array.from(byLower.values())
    .map((e) => e.name)
    .sort((a, b) => b.length - a.length);
  if (names.length === 0) return text;

  const pattern = new RegExp(
    `(?<![${WORD_CHAR}])(${names.map(escapeRegex).join("|")})(?![${WORD_CHAR}])`,
    "gi"
  );
  const parts = text.split(pattern);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const match = byLower.get(part.toLowerCase());
    if (match) {
      return (
        <Link
          key={`${keyPrefix}-h${i}`}
          href={`/lore/${match.id}`}
          className="text-amber-300 font-semibold rounded px-0.5 -mx-0.5 shadow-[0_0_10px_rgba(251,191,36,0.7)] hover:shadow-[0_0_16px_rgba(251,191,36,0.9)] transition-shadow"
        >
          {part}
        </Link>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t${i}`}>{part}</React.Fragment>;
  });
}

/** Parses a single line's inline markup (bold, italic, code, links, color/font spans) into React nodes. */
function parseInline(str: string, entries: HighlightEntry[], keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let rest = str;
  let cursor = 0;

  const codeRe = /^`([^`]+)`/;
  const boldRe = /^\*\*([^*]+)\*\*/;
  const italicRe = /^(\*([^*]+)\*|_([^_]+)_)/;
  const colorRe = /^\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/i;
  const fontRe = /^\[font=([^\]]+)\]([\s\S]*?)\[\/font\]/i;
  const linkRe = /^\[([^\]]+)\]\(([^)]+)\)/;

  while (rest.length > 0) {
    let m: RegExpMatchArray | null;

    if ((m = rest.match(codeRe))) {
      nodes.push(
        <code key={`${keyPrefix}-${cursor}`} className="px-1.5 py-0.5 rounded bg-black/40 text-amber-200 text-[0.9em] font-mono">
          {m[1]}
        </code>
      );
      rest = rest.slice(m[0].length);
      cursor++;
      continue;
    }

    if ((m = rest.match(colorRe))) {
      const color = resolveColor(m[1]);
      const inner = parseInline(m[2], entries, `${keyPrefix}-${cursor}c`);
      nodes.push(
        color ? (
          <span key={`${keyPrefix}-${cursor}`} style={{ color }}>
            {inner}
          </span>
        ) : (
          <React.Fragment key={`${keyPrefix}-${cursor}`}>{inner}</React.Fragment>
        )
      );
      rest = rest.slice(m[0].length);
      cursor++;
      continue;
    }

    if ((m = rest.match(fontRe))) {
      const fontClass = resolveFontClass(m[1]);
      const inner = parseInline(m[2], entries, `${keyPrefix}-${cursor}f`);
      nodes.push(
        fontClass ? (
          <span key={`${keyPrefix}-${cursor}`} className={fontClass}>
            {inner}
          </span>
        ) : (
          <React.Fragment key={`${keyPrefix}-${cursor}`}>{inner}</React.Fragment>
        )
      );
      rest = rest.slice(m[0].length);
      cursor++;
      continue;
    }

    if ((m = rest.match(boldRe))) {
      nodes.push(
        <strong key={`${keyPrefix}-${cursor}`} className="font-bold text-white">
          {parseInline(m[1], entries, `${keyPrefix}-${cursor}b`)}
        </strong>
      );
      rest = rest.slice(m[0].length);
      cursor++;
      continue;
    }

    if ((m = rest.match(italicRe))) {
      const content = m[2] ?? m[3] ?? "";
      nodes.push(
        <em key={`${keyPrefix}-${cursor}`}>{parseInline(content, entries, `${keyPrefix}-${cursor}i`)}</em>
      );
      rest = rest.slice(m[0].length);
      cursor++;
      continue;
    }

    if ((m = rest.match(linkRe))) {
      const [full, label, url] = m;
      if (isSafeUrl(url)) {
        nodes.push(
          <a
            key={`${keyPrefix}-${cursor}`}
            href={url}
            target={url.startsWith("/") ? undefined : "_blank"}
            rel={url.startsWith("/") ? undefined : "noopener noreferrer"}
            className="text-blue-400 underline hover:text-blue-300 transition-colors"
          >
            {label}
          </a>
        );
        rest = rest.slice(full.length);
        cursor++;
        continue;
      }
    }

    // No special token at the cursor: consume plain text up to the next one.
    const nextSpecial = rest.slice(1).search(/[`*_[]/);
    const chunkLen = nextSpecial === -1 ? rest.length : nextSpecial + 1;
    const chunk = rest.slice(0, chunkLen);
    nodes.push(
      <React.Fragment key={`${keyPrefix}-${cursor}`}>
        {highlightPlainText(chunk, entries, `${keyPrefix}-${cursor}`)}
      </React.Fragment>
    );
    rest = rest.slice(chunkLen);
    cursor++;
  }

  return nodes;
}

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "quote"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "hr" }
  | { kind: "paragraph"; lines: string[] };

function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ kind: "paragraph", lines: paragraphLines });
      paragraphLines = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;
    const trimmed = line.trim();

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    const isHr = trimmed === "---" || trimmed === "***";

    if (headingMatch) {
      flushParagraph();
      blocks.push({ kind: "heading", level: headingMatch[1].length as 1 | 2 | 3, text: headingMatch[2] });
    } else if (isHr) {
      flushParagraph();
      blocks.push({ kind: "hr" });
    } else if (quoteMatch) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "quote") last.lines.push(quoteMatch[1]);
      else blocks.push({ kind: "quote", lines: [quoteMatch[1]] });
    } else if (ulMatch) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(ulMatch[1]);
      else blocks.push({ kind: "ul", items: [ulMatch[1]] });
    } else if (olMatch) {
      flushParagraph();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ol") last.items.push(olMatch[1]);
      else blocks.push({ kind: "ol", items: [olMatch[1]] });
    } else {
      paragraphLines.push(line);
    }
  }
  flushParagraph();

  return blocks;
}

/** Renders lightweight GitHub-README-style markup: bold/italic/code/links/headings/lists/quotes,
 * plus `[color=name|#hex]` / `[font=name]` spans, with lore-entry titles glowing when they appear verbatim. */
export function renderRichText(text: string, entries: HighlightEntry[] = []): React.ReactNode {
  if (!text) return null;
  const blocks = parseBlocks(text);

  return blocks.map((block, bi) => {
    const key = `b${bi}`;
    switch (block.kind) {
      case "heading": {
        const Tag = (`h${block.level}` as unknown) as "h1" | "h2" | "h3";
        const sizeClass =
          block.level === 1 ? "text-2xl mt-6 mb-2" : block.level === 2 ? "text-xl mt-5 mb-2" : "text-lg mt-4 mb-1.5";
        return (
          <Tag key={key} className={`font-title font-bold text-white ${sizeClass}`}>
            {parseInline(block.text, entries, key)}
          </Tag>
        );
      }
      case "hr":
        return <hr key={key} className="border-white/10 my-6" />;
      case "quote":
        return (
          <blockquote key={key} className="border-l-2 border-amber-400/50 pl-4 my-3 text-gray-400 italic">
            {block.lines.map((l, li) => (
              <React.Fragment key={li}>
                {parseInline(l, entries, `${key}-${li}`)}
                {li < block.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </blockquote>
        );
      case "ul":
        return (
          <ul key={key} className="list-disc list-inside my-2 space-y-1">
            {block.items.map((item, li) => (
              <li key={li}>{parseInline(item, entries, `${key}-${li}`)}</li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol key={key} className="list-decimal list-inside my-2 space-y-1">
            {block.items.map((item, li) => (
              <li key={li}>{parseInline(item, entries, `${key}-${li}`)}</li>
            ))}
          </ol>
        );
      case "paragraph":
        return (
          <p key={key} className="my-2 first:mt-0">
            {block.lines.map((l, li) => (
              <React.Fragment key={li}>
                {parseInline(l, entries, `${key}-${li}`)}
                {li < block.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
    }
  });
}

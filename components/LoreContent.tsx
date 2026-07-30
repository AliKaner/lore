"use client";

import React from "react";
import Link from "next/link";

export type HighlightEntry = { id: string; name: string };

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const WORD_CHAR = "A-Za-z0-9_ÇĞİIıÖŞÜçğıöşü";

function renderWithHighlights(text: string, entries: HighlightEntry[]): React.ReactNode {
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

  return parts.map((part, i) => {
    const match = byLower.get(part.toLowerCase());
    if (match) {
      return (
        <Link
          key={i}
          href={`/lore/${match.id}`}
          className="text-amber-300 font-semibold rounded px-0.5 -mx-0.5 shadow-[0_0_10px_rgba(251,191,36,0.7)] hover:shadow-[0_0_16px_rgba(251,191,36,0.9)] transition-shadow"
        >
          {part}
        </Link>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

type LoreContentProps = {
  content: {
    tr?: string;
    en?: string;
  };
  defaultLang?: "tr" | "en";
  lang?: "tr" | "en";
  onLangChange?: (lang: "tr" | "en") => void;
  /** Lore entries whose titles should glow/link when they appear verbatim in the text. */
  entries?: HighlightEntry[];
};

export default function LoreContent({
  content,
  defaultLang = "tr",
  lang: externalLang,
  onLangChange,
  entries,
}: LoreContentProps) {
  const [internalLang, setInternalLang] = React.useState<"tr" | "en">(defaultLang);

  const lang = externalLang !== undefined ? externalLang : internalLang;
  const setLang = onLangChange !== undefined ? onLangChange : setInternalLang;

  const text = (content as any)?.[lang] || "";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm text-gray-300 font-text">Language</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as "tr" | "en")}
          className="bg-transparent border border-white/30 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-white/50 cursor-pointer"
        >
          <option value="tr" className="bg-gray-900">
            Türkçe
          </option>
          <option value="en" className="bg-gray-900">
            English
          </option>
        </select>
      </div>
      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-text text-lg">
        {entries && entries.length > 0 ? renderWithHighlights(text, entries) : text}
      </div>
    </div>
  );
}


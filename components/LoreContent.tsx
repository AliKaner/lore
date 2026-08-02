"use client";

import React from "react";
import { renderRichText, type HighlightEntry } from "./RichText";

export type { HighlightEntry };

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
      <div className="text-gray-300 leading-relaxed font-text text-lg">
        {renderRichText(text, entries ?? [])}
      </div>
    </div>
  );
}

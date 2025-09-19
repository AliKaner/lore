"use client";

import React from "react";

type LoreContentProps = {
  content: {
    tr?: string;
    en?: string;
  };
  defaultLang?: "tr" | "en";
};

export default function LoreContent({
  content,
  defaultLang = "tr",
}: LoreContentProps) {
  const [lang, setLang] = React.useState<"tr" | "en">(defaultLang);

  const text = (content as any)?.[lang] || "";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm text-gray-300 font-text">Language</label>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as "tr" | "en")}
          className="bg-transparent border border-white/30 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-white/50"
        >
          <option value="tr" className="bg-gray-900">
            Türkçe
          </option>
          <option value="en" className="bg-gray-900">
            English
          </option>
        </select>
      </div>
      <div className="text-gray-300 leading-relaxed whitespace-pre-line font-text text-lg">
        {text}
      </div>
    </div>
  );
}


"use client";

import React from "react";
import { useLocale } from "@/hooks/useLocale";

export default function ShareButton() {
  const { t } = useLocale();
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 cursor-pointer ${
        copied
          ? "bg-[var(--accent2-soft)] backdrop-blur-md border border-[var(--accent2)] text-[var(--accent)] hover:bg-[var(--accent2-soft-hover)]"
          : "bg-[var(--surface)] backdrop-blur-md border border-[var(--border-strong)] text-[var(--ink)] hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
      }`}
      aria-live="polite"
    >
      {copied ? (
        <>
          <svg
            className="w-5 h-5 text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t("share.copied")}
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {t("share.share")}
        </>
      )}
    </button>
  );
}


"use client";

import React from "react";

export default function ShareButton() {
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
          ? "bg-green-500/20 backdrop-blur-md border border-green-500/50 text-green-400 hover:bg-green-500/30"
          : "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-blue-600 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)]"
      }`}
      aria-live="polite"
    >
      {copied ? (
        <>
          <svg
            className="w-5 h-5 text-green-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
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
          Share
        </>
      )}
    </button>
  );
}


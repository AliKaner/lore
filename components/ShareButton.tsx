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
      className="px-6 py-3 bg-transparent border border-white/50 rounded-lg text-white font-semibold hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
      aria-live="polite"
    >
      {copied ? (
        <>
          <svg
            className="w-5 h-5 text-green-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
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
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12v7a2 2 0 002 2h7M20 12V5a2 2 0 00-2-2h-7m0 0L5 9m3-6l6 6"
            />
          </svg>
          Share
        </>
      )}
    </button>
  );
}


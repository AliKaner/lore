"use client";

import React, { useEffect, useState } from "react";
import { CleanTextarea } from "./CleanTextarea";

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  /** Unique key to autosave drafts under in localStorage. Omit to disable autosave. */
  storageKey?: string;
}

function countWords(text: string) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function ContentEditor({
  value,
  onChange,
  placeholder,
  rows = 12,
  storageKey,
}: ContentEditorProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);

  useEffect(() => {
    if (!storageKey || value) return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setDraftAvailable(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    if (value) {
      window.localStorage.setItem(storageKey, value);
    }
  }, [storageKey, value]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  const restoreDraft = () => {
    if (!storageKey) return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) onChange(saved);
    setDraftAvailable(false);
  };

  const discardDraft = () => {
    if (storageKey) window.localStorage.removeItem(storageKey);
    setDraftAvailable(false);
  };

  const wordCount = countWords(value);
  const readingTime = Math.ceil(wordCount / 80);

  const textarea = (
    <CleanTextarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={fullscreen ? 28 : rows}
      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 resize-y font-text leading-relaxed"
    />
  );

  return (
    <div>
      {draftAvailable && (
        <div className="flex items-center justify-between gap-3 mb-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm font-text">
          <span className="text-blue-300">Kaydedilmiş bir taslak bulundu.</span>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={restoreDraft}
              className="px-3 py-1 bg-blue-600/40 border border-blue-500/40 rounded text-white hover:bg-blue-600/60 transition-colors"
            >
              Geri Yükle
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="px-3 py-1 text-gray-400 hover:text-white transition-colors"
            >
              Yok Say
            </button>
          </div>
        </div>
      )}

      {fullscreen ? (
        <div className="fixed inset-0 z-50 bg-gray-950/98 backdrop-blur-sm p-4 md:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-text">
              {wordCount.toLocaleString("tr-TR")} kelime · ~{readingTime} dk okuma
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="px-4 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm font-text"
            >
              Küçült (Esc)
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <CleanTextarea
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              rows={28}
              className="w-full h-full bg-white/5 border border-white/20 rounded-lg px-6 py-5 text-white focus:outline-none focus:border-white/40 resize-none font-text leading-relaxed text-lg"
            />
          </div>
        </div>
      ) : (
        <>
          {textarea}
          <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500 font-text">
            <span>
              {wordCount.toLocaleString("tr-TR")} kelime · ~{readingTime} dk okuma
            </span>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Tam Ekran
            </button>
          </div>
        </>
      )}
    </div>
  );
}

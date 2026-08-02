"use client";

import React, { useEffect, useRef, useState } from "react";
import { CleanTextarea } from "./CleanTextarea";
import { RICH_TEXT_COLORS, RICH_TEXT_FONTS } from "./RichText";

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

type WrapAction = { before: string; after: string; placeholder: string };
type LinePrefixAction = { prefix: string; placeholder: string };

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Wraps the current selection (or inserts a placeholder) with the given markers. */
function applyWrap(textarea: HTMLTextAreaElement, value: string, onChange: (v: string) => void, action: WrapAction) {
  const { selectionStart, selectionEnd } = textarea;
  const selected = value.slice(selectionStart, selectionEnd) || action.placeholder;
  const next = value.slice(0, selectionStart) + action.before + selected + action.after + value.slice(selectionEnd);
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const start = selectionStart + action.before.length;
    textarea.setSelectionRange(start, start + selected.length);
  });
}

/** Prefixes the line(s) touching the current selection with the given marker. */
function applyLinePrefix(textarea: HTMLTextAreaElement, value: string, onChange: (v: string) => void, action: LinePrefixAction) {
  const { selectionStart, selectionEnd } = textarea;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  let lineEnd = value.indexOf("\n", selectionEnd);
  if (lineEnd === -1) lineEnd = value.length;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.length > 0 ? block.split("\n") : [action.placeholder];
  const prefixed = lines.map((l) => (l.trim() ? action.prefix + l : l)).join("\n");
  const next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineStart + prefixed.length);
  });
}

function FormatToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [customHex, setCustomHex] = useState("#");

  const withTextarea = (fn: (ta: HTMLTextAreaElement) => void) => {
    const ta = textareaRef.current;
    if (ta) fn(ta);
  };

  const wrapSelection = (action: WrapAction) =>
    withTextarea((ta) => applyWrap(ta, value, onChange, action));

  const prefixLines = (action: LinePrefixAction) =>
    withTextarea((ta) => applyLinePrefix(ta, value, onChange, action));

  const applyColor = (colorName: string) => {
    wrapSelection({ before: `[color=${colorName}]`, after: "[/color]", placeholder: "metin" });
    setColorOpen(false);
  };

  const applyFont = (fontName: string) => {
    wrapSelection({ before: `[font=${fontName}]`, after: "[/font]", placeholder: "metin" });
    setFontOpen(false);
  };

  const btnClass =
    "px-2 py-1 rounded text-xs font-text text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0";

  return (
    <div className="flex flex-wrap items-center gap-1 mb-1.5 p-1.5 bg-white/5 border border-white/10 rounded-lg">
      <button type="button" className={`${btnClass} font-bold`} title="Kalın" onClick={() => wrapSelection({ before: "**", after: "**", placeholder: "kalın metin" })}>
        B
      </button>
      <button type="button" className={`${btnClass} italic`} title="İtalik" onClick={() => wrapSelection({ before: "*", after: "*", placeholder: "italik metin" })}>
        i
      </button>
      <button type="button" className={`${btnClass} font-mono`} title="Kod" onClick={() => wrapSelection({ before: "`", after: "`", placeholder: "kod" })}>
        {"</>"}
      </button>
      <span className="w-px h-4 bg-white/10 mx-0.5" />
      <button type="button" className={btnClass} title="Başlık" onClick={() => prefixLines({ prefix: "## ", placeholder: "Başlık" })}>
        H
      </button>
      <button type="button" className={btnClass} title="Alıntı" onClick={() => prefixLines({ prefix: "> ", placeholder: "alıntı" })}>
        ❝
      </button>
      <button type="button" className={btnClass} title="Madde listesi" onClick={() => prefixLines({ prefix: "- ", placeholder: "madde" })}>
        •—
      </button>
      <button type="button" className={btnClass} title="Numaralı liste" onClick={() => prefixLines({ prefix: "1. ", placeholder: "madde" })}>
        1.
      </button>
      <button type="button" className={btnClass} title="Bağlantı" onClick={() => wrapSelection({ before: "[", after: "](https://)", placeholder: "bağlantı metni" })}>
        🔗
      </button>
      <span className="w-px h-4 bg-white/10 mx-0.5" />

      <div className="relative">
        <button
          type="button"
          className={btnClass}
          title="Yazı rengi"
          onClick={() => {
            setColorOpen((v) => !v);
            setFontOpen(false);
          }}
        >
          🎨 Renk
        </button>
        {colorOpen && (
          <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-gray-900 border border-white/20 rounded-lg shadow-xl w-48">
            <div className="grid grid-cols-8 gap-1 mb-2">
              {RICH_TEXT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.label}
                  onClick={() => applyColor(c.name)}
                  className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                placeholder="#RRGGBB"
                className="w-20 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none"
              />
              <button
                type="button"
                disabled={!HEX_PATTERN.test(customHex)}
                onClick={() => applyColor(customHex)}
                className="text-xs px-2 py-0.5 bg-white/10 border border-white/20 rounded text-white hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                Uygula
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          className={btnClass}
          title="Yazı tipi"
          onClick={() => {
            setFontOpen((v) => !v);
            setColorOpen(false);
          }}
        >
          🔤 Font
        </button>
        {fontOpen && (
          <div className="absolute z-10 top-full left-0 mt-1 p-1 bg-gray-900 border border-white/20 rounded-lg shadow-xl w-36">
            {RICH_TEXT_FONTS.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => applyFont(f.name)}
                className="w-full text-left px-2 py-1 rounded text-xs text-gray-200 hover:bg-white/10 transition-colors"
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fullscreenTextareaRef = useRef<HTMLTextAreaElement>(null);

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
          <FormatToolbar textareaRef={fullscreenTextareaRef} value={value} onChange={onChange} />
          <div className="flex-1 min-h-0">
            <CleanTextarea
              ref={fullscreenTextareaRef}
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
          <FormatToolbar textareaRef={textareaRef} value={value} onChange={onChange} />
          <CleanTextarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 resize-y font-text leading-relaxed"
          />
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

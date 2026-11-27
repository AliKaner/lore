"use client";

import { useEffect, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { isCommonWord, lowerIn, type Lang } from "@/lib/completion";
import { addOwnWord, spellChecker } from "@/lib/spellClient";
import { spellKey } from "@/lib/spellExtension";
import { useT } from "@/lib/i18n";

const upper = (lang: Lang, text: string) => text.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US");

// Suggestions for a word with a wavy line, opened by clicking it: the
// likeliest spellings (common words first), "add to my dictionary" and
// "ignore".
export default function SpellMenu({ editor, lang }: { editor: Editor; lang: Lang }) {
  const t = useT();
  const open = useEditorState({ editor, selector: ({ editor: e }) => (e ? spellKey.getState(e.state)?.open ?? null : null) });
  const [suggestions, setSuggestions] = useState<{ word: string; list: string[] } | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    const word = open.word;
    void spellChecker(lang)
      ?.suggest(word)
      .then((raw) => {
        if (!live) return;
        const capital = word[0] !== lowerIn(lang, word[0]);
        const seen = new Set<string>();
        const list = raw
          .filter((s) => s === lowerIn(lang, s) || s[0] !== lowerIn(lang, s[0]) && s.slice(1) === lowerIn(lang, s.slice(1)))
          .map((s) => (capital ? upper(lang, s[0]) + s.slice(1) : s))
          .filter((s) => {
            const key = lowerIn(lang, s);
            if (seen.has(key) || key === lowerIn(lang, word)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => Number(isCommonWord(lang, lowerIn(lang, b))) - Number(isCommonWord(lang, lowerIn(lang, a))))
          .slice(0, 5);
        setSuggestions({ word, list });
      });
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && editor.commands.openSpell(null);
    window.addEventListener("keydown", onKey);
    return () => {
      live = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lang, editor]);

  if (!open || editor.isDestroyed) return null;
  let coords: { left: number; bottom: number };
  try {
    coords = editor.view.coordsAtPos(open.from);
  } catch {
    return null;
  }
  const list = suggestions?.word === open.word ? suggestions.list : null;

  function replace(text: string) {
    if (!open) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.insertText(text, open.from, open.to);
        return true;
      })
      .run();
  }

  return (
    <div
      role="menu"
      aria-label={t("Yazım önerileri")}
      onMouseDown={(event) => event.preventDefault()}
      style={{ left: Math.max(8, Math.min(coords.left - 8, window.innerWidth - 248)), top: coords.bottom + 6 }}
      className="menu-pop fixed z-[60] w-60 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[0_18px_40px_-18px_rgba(15,25,57,0.45)]"
    >
      {list === null ? (
        <p className="px-3 py-2 text-sm text-muted">{t("Öneriler aranıyor…")}</p>
      ) : list.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted">{t("Öneri yok")}</p>
      ) : (
        list.map((word) => (
          <button
            key={word}
            type="button"
            role="menuitem"
            onClick={() => replace(word)}
            className="block w-full px-3 py-1.5 text-left font-medium hover:bg-accent-soft/70"
          >
            {word}
          </button>
        ))
      )}
      <div className="mt-1 border-t border-border/70 pt-1">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            addOwnWord(lang, open.word);
            editor.commands.ignoreSpelling(open.word);
          }}
          className="block w-full px-3 py-1.5 text-left text-sm text-muted hover:bg-accent-soft/70 hover:text-foreground"
        >
          {t("Sözlüğüme ekle")}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => editor.commands.ignoreSpelling(open.word)}
          className="block w-full px-3 py-1.5 text-left text-sm text-muted hover:bg-accent-soft/70 hover:text-foreground"
        >
          {t("Bu yazıda yoksay")}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import type { Lang } from "@/lib/completion";
import { spellChecker } from "@/lib/spellClient";
import { spellKey } from "@/lib/spellExtension";
import { rankSuggestions } from "@/lib/spellSuggest";
import { useI18n } from "@/lib/i18n";

type Fix = { word: string; count: number; choices: string[]; pick: string; on: boolean };

// Fix every spelling at once: a quiet pill when the text has unknown words;
// it opens the list of changes (word → suggestion, each can be changed or
// left out), and applying them marks the changed words for a few seconds.
// One undo takes it all back.
export default function SpellFixAll({ editor, lang }: { editor: Editor; lang: Lang }) {
  const { t, num } = useI18n();
  const marks = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const set = e ? spellKey.getState(e.state)?.decorations : null;
      return (set?.find() ?? []).map((d) => ({ from: d.from, to: d.to, word: (d.spec as { word: string }).word }));
    },
    equalityFn: (a, b) => !!a && !!b && a.length === b.length && a.every((m, i) => m.from === b[i].from && m.word === b[i].word),
  });
  const words = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of marks ?? []) counts.set(m.word, (counts.get(m.word) ?? 0) + 1);
    return counts;
  }, [marks]);
  const [open, setOpen] = useState(false);
  const [fixes, setFixes] = useState<Fix[] | null>(null);
  const [done, setDone] = useState<number | null>(null);

  // Suggestions for every unknown word, once the list opens.
  useEffect(() => {
    if (!open) return;
    let live = true;
    const checker = spellChecker(lang);
    void (async () => {
      const out: Fix[] = [];
      for (const [word, count] of words) {
        const raw = (await checker?.suggest(word)) ?? [];
        const choices = rankSuggestions(lang, word, raw);
        out.push({ word, count, choices, pick: choices[0] ?? "", on: choices.length > 0 });
      }
      if (live) setFixes(out);
    })();
    return () => {
      live = false;
    };
  }, [open, words, lang]);

  useEffect(() => {
    if (done === null) return;
    const timer = window.setTimeout(() => setDone(null), 6000);
    return () => window.clearTimeout(timer);
  }, [done]);

  function apply() {
    if (!fixes || !marks) return;
    const chosen = new Map(fixes.filter((f) => f.on && f.pick).map((f) => [f.word, f.pick]));
    const targets = marks.filter((m) => chosen.has(m.word)).sort((a, b) => b.from - a.from);
    if (targets.length === 0) return;
    // From the end backwards, so earlier positions stay right; then the new
    // words' places for the flash, counted forwards.
    const { tr } = editor.state;
    for (const m of targets) tr.insertText(chosen.get(m.word)!, m.from, m.to);
    const ranges = targets.map((m) => ({ from: tr.mapping.map(m.from, -1), to: tr.mapping.map(m.to, 1) }));
    editor.view.dispatch(tr);
    editor.commands.flashRanges(ranges);
    setDone(targets.length);
    setOpen(false);
    setFixes(null);
  }

  const total = marks?.length ?? 0;
  if (total === 0 && done === null) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[55] flex flex-col items-end gap-2">
      {open && (
        <div role="dialog" aria-label={t("Yazım hatalarını düzelt")} className="menu-pop w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-28px_rgba(15,25,57,0.55)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-medium">{t("Düzeltilecekler")}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("Kapat")} className="text-muted hover:text-foreground">
              ✕
            </button>
          </div>
          <ul className="max-h-[50vh] overflow-y-auto">
            {fixes === null ? (
              <li className="px-4 py-3 text-sm text-muted">{t("Öneriler aranıyor…")}</li>
            ) : (
              fixes.map((fix, i) => (
                <li key={fix.word} className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5 text-sm last:border-b-0">
                  <input
                    type="checkbox"
                    checked={fix.on}
                    disabled={fix.choices.length === 0}
                    onChange={(event) => setFixes(fixes.map((f, j) => (j === i ? { ...f, on: event.target.checked } : f)))}
                    className="accent-[var(--accent)]"
                    aria-label={fix.word}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    <del className="text-[#a23a55] decoration-1 dark:text-[#f0a3b4]">{fix.word}</del>
                    {fix.count > 1 && <span className="ml-1 text-xs text-muted">×{num(fix.count)}</span>}
                  </span>
                  <span aria-hidden="true" className="text-muted">→</span>
                  {fix.choices.length === 0 ? (
                    <span className="text-xs text-muted">{t("Öneri yok")}</span>
                  ) : (
                    <select
                      value={fix.pick}
                      onChange={(event) => setFixes(fixes.map((f, j) => (j === i ? { ...f, pick: event.target.value, on: true } : f)))}
                      className="max-w-[9rem] rounded-md border border-border bg-background px-1.5 py-1 text-sm font-medium text-[#1f5a35] dark:text-[#a6dfb7]"
                    >
                      {fix.choices.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              ))
            )}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <span className="text-xs text-muted">{t("Tek Ctrl+Z ile hepsi geri alınır")}</span>
            <button
              type="button"
              onClick={apply}
              disabled={!fixes || !fixes.some((f) => f.on)}
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-contrast hover:bg-accent-hover disabled:opacity-45"
            >
              {t("Uygula ({n})", { n: num(fixes?.filter((f) => f.on).reduce((s, f) => s + f.count, 0) ?? 0) })}
            </button>
          </div>
        </div>
      )}
      {done !== null && !open ? (
        <div role="status" className="menu-pop rounded-full bg-[#1f5a35] px-4 py-2 text-sm text-white shadow-lg dark:bg-[#2c6b44]">
          {t("{n} kelime düzeltildi", { n: num(done) })} ·{" "}
          <button type="button" onClick={() => editor.chain().focus().undo().run()} className="underline underline-offset-2">
            {t("Geri al")}
          </button>
        </div>
      ) : (
        total > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/95 px-4 py-2 text-sm shadow-[0_12px_30px_-16px_rgba(15,25,57,0.5)] backdrop-blur hover:border-accent"
          >
            <span className="h-2 w-2 rounded-full bg-[#c2410c]" aria-hidden="true" />
            {t("{n} yazım hatası", { n: num(total) })}
            <span className="font-medium text-accent">{t("Toplu düzelt")}</span>
          </button>
        )
      )}
    </div>
  );
}

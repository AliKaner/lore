"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { FlowWord } from "@/lib/editorExtensions";
import { readPref, writePref } from "@/lib/readingPrefs";
import { useT } from "@/lib/i18n";

const MIN_WPM = 100;
const MAX_WPM = 900;

// The letter the eye should land on (optimal recognition point): a little
// left of centre, as in Spritz-style readers.
function focusIndex(length: number) {
  if (length <= 1) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;
  return 4;
}

// Punctuation and paragraph ends get a breath; long words a little longer.
function delayFor(word: FlowWord, wpm: number) {
  let factor = 1;
  if (/[.!?…]["'»”’)]*$/u.test(word.text)) factor = 2.2;
  else if (/[,;:–—]["'»”’)]*$/u.test(word.text)) factor = 1.5;
  if (word.paragraphEnd) factor = Math.max(factor, 2.6);
  if (word.text.length > 8) factor *= 1.25;
  return (60_000 / wpm) * factor;
}

function minutes(words: number, wpm: number, t: (text: string, vars?: Record<string, number>) => string) {
  const value = words / wpm;
  return value < 1 ? t("1 dakikadan az") : t("~{n} dk", { n: Math.round(value) });
}

// Rapid serial visual presentation: one word at a time in a fixed spot, so
// the eye never has to travel along the line.
export default function SpeedReader({
  words,
  title,
  onClose,
}: {
  words: FlowWord[];
  title: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wpm, setWpm] = useState(() => readPref("wpm", 300));
  const t = useT();
  const last = words.length - 1;
  const finished = index >= last && !playing && index > 0;

  useEffect(() => {
    writePref("wpm", wpm);
  }, [wpm]);

  useEffect(() => {
    if (!playing || words.length === 0) return;
    const timer = window.setTimeout(() => {
      if (index >= last) setPlaying(false);
      else setIndex(index + 1);
    }, delayFor(words[index], wpm));
    return () => window.clearTimeout(timer);
  }, [playing, index, wpm, words, last]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function toggle() {
    if (finished) {
      setIndex(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  }
  const jump = (delta: number) => setIndex((i) => Math.min(last, Math.max(0, i + delta)));
  const changeSpeed = (delta: number) =>
    setWpm((w) => Math.min(MAX_WPM, Math.max(MIN_WPM, w + delta)));

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape") onClose();
    else if (event.key === " ") {
      event.preventDefault();
      toggle();
    } else if (event.key === "ArrowLeft") jump(-10);
    else if (event.key === "ArrowRight") jump(10);
    else if (event.key === "ArrowUp") {
      event.preventDefault();
      changeSpeed(25);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      changeSpeed(-25);
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const word = words[index]?.text ?? "";
  const focus = focusIndex(word.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("Hızlı okuma")}
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="truncate text-sm text-muted">
          <span className="font-medium text-foreground">{t("Akış")}</span> · {title}
        </p>
        <button onClick={onClose} className="shrink-0 text-sm text-muted underline">
          {t("Kapat")} <span className="hidden sm:inline">(Esc)</span>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4">
        <div className="relative w-full max-w-3xl py-10">
          <span aria-hidden="true" className="absolute left-1/2 top-0 h-6 w-px bg-caramel" />
          <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-6 w-px bg-caramel" />
          <div
            aria-live="off"
            className="grid grid-cols-[1fr_auto_1fr] whitespace-pre font-display text-4xl leading-none sm:text-6xl"
          >
            <span className="text-right">{word.slice(0, focus)}</span>
            <span className="text-caramel">{word.charAt(focus)}</span>
            <span className="text-left">{word.slice(focus + 1)}</span>
          </div>
        </div>
        {!playing && index === 0 && (
          <p className="absolute bottom-6 text-center text-sm text-muted">
            {t("Gözünü karamel çizgilere sabitle. Boşluk tuşu başlatır ve durdurur.")}
          </p>
        )}
        {finished && (
          <p className="absolute bottom-6 text-center text-sm text-muted">{t("Bitti.")}</p>
        )}
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(0, last)}
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
            aria-label={t("Metindeki yer")}
            className="w-full accent-[var(--caramel)]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="tabular-nums text-muted">
              {index + 1} / {words.length} · {t("kalan")} {minutes(last - index, wpm, t)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => jump(-10)}
                aria-label={t("10 kelime geri")}
                className="rounded-sm px-2 py-1 text-muted hover:text-foreground"
              >
                ← 10
              </button>
              <button
                onClick={toggle}
                autoFocus
                className="min-w-28 rounded-sm bg-accent px-4 py-2 font-medium text-accent-contrast hover:bg-accent-hover"
              >
                {playing ? t("Durdur") : finished ? t("Baştan") : index === 0 ? t("Başlat") : t("Devam")}
              </button>
              <button
                onClick={() => jump(10)}
                aria-label={t("10 kelime ileri")}
                className="rounded-sm px-2 py-1 text-muted hover:text-foreground"
              >
                10 →
              </button>
            </div>
            <div className="flex items-center gap-1" role="group" aria-label={t("Hız")}>
              <button
                onClick={() => changeSpeed(-25)}
                aria-label={t("Yavaşlat")}
                className="h-8 w-8 rounded-sm border border-border hover:border-border-hover"
              >
                −
              </button>
              <span className="w-24 text-center tabular-nums">{t("{n} kelime/dk", { n: wpm })}</span>
              <button
                onClick={() => changeSpeed(25)}
                aria-label={t("Hızlandır")}
                className="h-8 w-8 rounded-sm border border-border hover:border-border-hover"
              >
                +
              </button>
            </div>
          </div>
          <p className="hidden text-center text-xs text-muted sm:block">
            Boşluk: başlat/durdur · ← →: 10 kelime · ↑ ↓: hız · Esc: kapat
          </p>
        </div>
      </div>
    </div>
  );
}

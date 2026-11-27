"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useT } from "@/lib/i18n";

type Lang = "tr" | "en";
type State = "idle" | "speaking" | "paused";

const RATES = [0.8, 1, 1.2, 1.5];
const BLOCKS = "p, h1, h2, h3";

// Sentences of at most ~220 characters: some voices stop on longer text.
function chunks(text: string): string[] {
  const sentences = text.split(/(?<=[.!?…:;])\s+/u).filter((s) => s.trim());
  const out: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 220) {
      out.push(sentence);
      continue;
    }
    let rest = sentence;
    while (rest.length > 220) {
      const cut = rest.lastIndexOf(" ", 220);
      out.push(rest.slice(0, cut > 80 ? cut : 220));
      rest = rest.slice(cut > 80 ? cut + 1 : 220);
    }
    if (rest.trim()) out.push(rest);
  }
  return out;
}

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
  // Natural/online voices sound best where the browser has them.
  return (
    voices.find((v) => /natural|neural|online|google/iu.test(v.name)) ??
    voices.find((v) => v.localService) ??
    voices[0] ??
    null
  );
}

// Reads the chapter aloud with the browser's own voice, paragraph by
// paragraph, marking the one being read. Hearing the text is how many
// writers catch what the eye skips. Clicking a paragraph reads from there.
export default function ReadAloud({ container, lang }: { container: RefObject<HTMLElement | null>; lang: Lang }) {
  const t = useT();
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [rate, setRate] = useState(1);
  const run = useRef(0);
  const current = useRef<HTMLElement | null>(null);
  const index = useRef(0);
  const rateRef = useRef(1);

  useEffect(() => {
    // Known only in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    // Voices arrive late in some browsers; asking early warms the list.
    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();
    return () => {
      run.current += 1;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      current.current?.classList.remove("tts-current");
    };
  }, []);

  function blocks(): HTMLElement[] {
    const root = container.current;
    if (!root) return [];
    return [...root.querySelectorAll<HTMLElement>(BLOCKS)].filter((el) => el.textContent?.trim());
  }

  function mark(el: HTMLElement | null) {
    current.current?.classList.remove("tts-current");
    current.current = el;
    if (el) {
      el.classList.add("tts-current");
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  function stop() {
    run.current += 1;
    window.speechSynthesis.cancel();
    mark(null);
    setState("idle");
  }

  function readFrom(start: number) {
    const synth = window.speechSynthesis;
    const mine = ++run.current;
    synth.cancel();
    const all = blocks();
    if (start >= all.length) {
      stop();
      return;
    }
    const voice = pickVoice(lang);
    const readBlock = (i: number) => {
      if (run.current !== mine) return;
      if (i >= all.length) {
        mark(null);
        setState("idle");
        return;
      }
      index.current = i;
      mark(all[i]);
      const parts = chunks(all[i].textContent ?? "");
      const speak = (p: number) => {
        if (run.current !== mine) return;
        if (p >= parts.length) return readBlock(i + 1);
        const utterance = new SpeechSynthesisUtterance(parts[p]);
        utterance.lang = lang === "tr" ? "tr-TR" : "en-US";
        if (voice) utterance.voice = voice;
        utterance.rate = rateRef.current;
        utterance.onend = () => speak(p + 1);
        utterance.onerror = (event) => {
          if (event.error !== "interrupted" && event.error !== "canceled") speak(p + 1);
        };
        synth.speak(utterance);
      };
      speak(0);
    };
    setState("speaking");
    readBlock(start);
  }

  // While reading, a click on a paragraph reads from there.
  useEffect(() => {
    const root = container.current;
    if (!root || state === "idle") return;
    const onClick = (event: MouseEvent) => {
      const block = (event.target as HTMLElement).closest<HTMLElement>(BLOCKS);
      if (!block) return;
      const i = blocks().indexOf(block);
      if (i >= 0) readFrom(i);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  });

  if (!supported) return null;

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => readFrom(0)}
        title={t("Bölümü yüksek sesle okur; takılan cümleler kulakla daha kolay yakalanır")}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-muted transition-colors hover:border-border-hover hover:text-foreground"
      >
        <SpeakerIcon />
        {t("Sesli oku")}
      </button>
    );
  }

  return (
    <div
      role="toolbar"
      aria-label={t("Sesli okuma")}
      className="menu-pop fixed inset-x-0 bottom-5 z-50 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-1 rounded-full border border-border bg-surface/95 p-1.5 shadow-[0_18px_44px_-18px_rgba(15,25,57,0.55)] backdrop-blur"
    >
      <span className="hidden px-2 text-xs text-muted sm:inline">{t("Sesli okuma")}</span>
      <button
        type="button"
        aria-label={t("Önceki paragraf")}
        onClick={() => readFrom(Math.max(0, index.current - 1))}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft/60 hover:text-foreground"
      >
        ⏮
      </button>
      {state === "speaking" ? (
        <button
          type="button"
          onClick={() => {
            window.speechSynthesis.pause();
            setState("paused");
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast"
        >
          ❚❚ {t("Duraklat")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            // Some browsers lose a paused utterance; reading the paragraph
            // again is the safe way back.
            if (window.speechSynthesis.paused && window.speechSynthesis.speaking) {
              window.speechSynthesis.resume();
              setState("speaking");
            } else readFrom(index.current);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast"
        >
          ▶ {t("Devam")}
        </button>
      )}
      <button
        type="button"
        aria-label={t("Sonraki paragraf")}
        onClick={() => readFrom(index.current + 1)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft/60 hover:text-foreground"
      >
        ⏭
      </button>
      <button
        type="button"
        title={t("Okuma hızı")}
        onClick={() => {
          const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
          setRate(next);
          rateRef.current = next;
          if (state === "speaking") readFrom(index.current);
        }}
        className="inline-flex h-9 min-w-12 items-center justify-center rounded-full px-2 text-sm tabular-nums text-muted hover:bg-accent-soft/60 hover:text-foreground"
      >
        {rate}×
      </button>
      <button
        type="button"
        aria-label={t("Sesli okumayı kapat")}
        onClick={stop}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft/60 hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8h2.5l4-3v10l-4-3H3.5zM13 7.5a3.5 3.5 0 0 1 0 5M15.2 5.3a6.5 6.5 0 0 1 0 9.4" />
    </svg>
  );
}

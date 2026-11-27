"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

// A writing sprint: a set time (and a word target, if wanted), a quiet
// countdown in the top bar, and at the end how many words came out. The
// best sprint is remembered on this device.

type Sprint = { endsAt: number; minutes: number; startWords: number; target: number | null };
type Result = { words: number; minutes: number; target: number | null; best: boolean };

const DURATIONS = [10, 15, 25, 45];
const TARGETS = [null, 250, 500, 1000];
const BEST_KEY = "booktion:sprint-rekor";

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

// Words per minute is what a "best" compares, so a long sprint and a
// short one are measured alike.
function pace(words: number, minutes: number) {
  return words / Math.max(1, minutes);
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function WritingSprint({ words }: { words: number }) {
  const { t, num } = useI18n();
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [target, setTarget] = useState<number | null>(500);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const wordsRef = useRef(words);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  // The countdown.
  useEffect(() => {
    if (!sprint) return;
    const tick = () => {
      const at = Date.now();
      setNow(at);
      if (at >= sprint.endsAt) {
        const written = Math.max(0, wordsRef.current - sprint.startWords);
        const best = pace(written, sprint.minutes) > readBest() && written > 0;
        if (best) {
          try {
            window.localStorage.setItem(BEST_KEY, String(pace(written, sprint.minutes)));
          } catch {}
        }
        setResult({ words: written, minutes: sprint.minutes, target: sprint.target, best });
        setSprint(null);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [sprint]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function start() {
    setSprint({ endsAt: Date.now() + minutes * 60_000, minutes, startWords: words, target });
    setResult(null);
    setOpen(false);
  }

  const written = sprint ? Math.max(0, words - sprint.startWords) : 0;
  const left = sprint ? sprint.endsAt - now : 0;
  const progress = sprint?.target ? Math.min(1, written / sprint.target) : sprint ? 1 - left / (sprint.minutes * 60_000) : 0;

  return (
    <div ref={box} className="relative">
      {sprint ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          title={t("Sprint sürüyor")}
          className="relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-full bg-caramel-soft px-3 text-sm tabular-nums text-foreground"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 bg-caramel/30 transition-[width] duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
          <span className="relative">{clock(left)}</span>
          <span className="relative text-xs text-muted">
            +{num(written)}
            {sprint.target ? `/${num(sprint.target)}` : ""}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={t("Yazma sprinti")}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition-colors ${
            open ? "bg-accent-soft/70 text-foreground" : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
          }`}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="10" cy="11" r="6" />
            <path d="M10 8v3l2 1.5M8.5 2.5h3M15 5l1.2-1.2" />
          </svg>
          <span className="hidden 2xl:inline">{t("Sprint")}</span>
        </button>
      )}

      {open && (
        <div className="menu-pop absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-surface p-4 shadow-[0_24px_50px_-24px_rgba(15,25,57,0.45)]" style={{ transformOrigin: "100% 0" }}>
          {sprint ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{t("Sprint sürüyor")}</p>
              <p className="mt-2 font-display text-3xl tabular-nums">{clock(left)}</p>
              <p className="mt-1 text-sm text-muted">
                {t("{n} kelime yazdın", { n: num(written) })}
                {sprint.target ? ` · ${t("hedef {n}", { n: num(sprint.target) })}` : ""}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSprint(null);
                  setOpen(false);
                }}
                className="mt-4 text-sm text-muted underline decoration-dotted underline-offset-4 hover:text-foreground"
              >
                {t("Sprinti bitir")}
              </button>
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{t("Yazma sprinti")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t("Süre bitene kadar yalnızca yaz; düzeltmeyi sonraya bırak.")}
              </p>
              <p className="mt-3 text-sm">{t("Süre")}</p>
              <div className="mt-1.5 flex gap-1.5">
                {DURATIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={minutes === m}
                    onClick={() => setMinutes(m)}
                    className={`flex-1 rounded-full py-1 text-sm ${minutes === m ? "bg-accent text-accent-contrast" : "bg-accent-soft/50 text-muted hover:text-foreground"}`}
                  >
                    {t("{n} dk", { n: m })}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm">{t("Kelime hedefi")}</p>
              <div className="mt-1.5 flex gap-1.5">
                {TARGETS.map((n) => (
                  <button
                    key={n ?? "none"}
                    type="button"
                    aria-pressed={target === n}
                    onClick={() => setTarget(n)}
                    className={`flex-1 rounded-full py-1 text-sm ${target === n ? "bg-accent text-accent-contrast" : "bg-accent-soft/50 text-muted hover:text-foreground"}`}
                  >
                    {n === null ? t("Yok") : num(n)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={start}
                className="mt-4 w-full rounded-full bg-accent py-2 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
              >
                {t("Başla")}
              </button>
            </>
          )}
        </div>
      )}

      {result && (
        <div role="status" className="menu-pop fixed inset-x-0 top-20 z-[60] mx-auto w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-5 text-center shadow-[0_30px_70px_-30px_rgba(15,25,57,0.6)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-caramel">
            {result.best ? t("Yeni rekor") : t("Sprint bitti")}
          </p>
          <p className="mt-2 font-display text-4xl tabular-nums">{num(result.words)}</p>
          <p className="text-sm text-muted">{t("{m} dakikada yazdığın kelime", { m: result.minutes })}</p>
          {result.target && (
            <p className="mt-2 text-sm">
              {result.words >= result.target ? t("Hedefi geçtin.") : t("Hedefe {n} kelime kaldı.", { n: num(result.target - result.words) })}
            </p>
          )}
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-4 rounded-full bg-accent px-5 py-1.5 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
          >
            {t("Tamam")}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { playKey } from "@/lib/typingSounds";
import { SOUNDS, type WritingModes } from "@/lib/writingModes";

function Toggle({
  on,
  onChange,
  title,
  hint,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-accent-soft/40"
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${on ? "bg-accent" : "bg-border-hover"}`}
      >
        <span className={`h-4 w-4 rounded-full bg-surface shadow transition-transform duration-200 ${on ? "translate-x-4" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs leading-snug text-muted">{hint}</span>
      </span>
    </button>
  );
}

const QuillIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 3.5C11 4 7 8 5.5 14.5M16.5 3.5c.5 5-3 9.5-9 10.6M5.5 14.5 3.5 17M8 11h4" />
  </svg>
);

// Typewriter and focus modes, and the typing sound.
export default function WritingModeMenu({
  modes,
  onChange,
}: {
  modes: WritingModes;
  onChange: (patch: Partial<WritingModes>) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const active = modes.typewriter || modes.focus || modes.sound !== "none";

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        title="Yazma modu ve sesler"
        onClick={() => setOpen((o) => !o)}
        className={`relative inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm transition-colors ${
          open || active ? "bg-accent-soft/70 text-foreground" : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
        }`}
      >
        <QuillIcon />
        <span className="hidden xl:inline">Mod</span>
        <span className="sr-only">Yazma modu</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Yazma modu"
          className="menu-pop absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-surface p-1.5 shadow-[0_24px_50px_-24px_rgba(15,25,57,0.45)]"
          style={{ transformOrigin: "100% 0" }}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Yazma modu</p>
          <Toggle
            on={modes.typewriter}
            onChange={(typewriter) => onChange({ typewriter })}
            title="Daktilo"
            hint="Yazdığın satır ekranda hep aynı yerde durur, yazı yukarı akar."
          />
          <Toggle
            on={modes.focus}
            onChange={(focus) => onChange({ focus })}
            title="Odak"
            hint="Yalnızca üzerinde çalıştığın paragraf belirgin kalır."
          />
          <div className="my-1.5 h-px bg-border" />
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Yazma sesi</p>
          <div role="radiogroup" aria-label="Yazma sesi">
            {SOUNDS.map((sound) => (
              <button
                key={sound.id}
                type="button"
                role="radio"
                aria-checked={modes.sound === sound.id}
                onClick={() => {
                  onChange({ sound: sound.id });
                  // A taste of it, so the choice is heard, not guessed.
                  if (sound.id !== "none") {
                    [0, 110, 200, 330].forEach((ms, i) =>
                      window.setTimeout(() => playKey(sound.id, i === 2 ? "space" : "char", modes.volume), ms),
                    );
                  }
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-sm ${
                  modes.sound === sound.id ? "bg-accent-soft/70" : "hover:bg-accent-soft/40"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                    modes.sound === sound.id ? "border-[5px] border-accent" : "border-border-hover"
                  }`}
                />
                <span className="flex-1">{sound.label}</span>
                <span className="truncate text-[11px] text-muted">{sound.hint}</span>
              </button>
            ))}
          </div>
          {modes.sound !== "none" && (
            <label className="flex items-center gap-3 px-2.5 pb-2 pt-2 text-xs text-muted">
              Ses
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={modes.volume}
                onChange={(event) => onChange({ volume: Number(event.target.value) })}
                onPointerUp={() => playKey(modes.sound, "char", modes.volume)}
                className="flex-1 accent-[var(--accent)]"
                aria-label="Ses düzeyi"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

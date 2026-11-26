"use client";

import { useEffect, useRef, useState } from "react";
import { PAPERS, type Paper, type PaperId } from "@/lib/paper";

// A little sheet in the paper's proportions.
function SheetIcon({ paper, active }: { paper: Paper | null; active?: boolean }) {
  const w = paper ? 12 * (paper.width / paper.height) : 12;
  const h = paper ? 12 : 9;
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <rect
        x={8 - w / 2}
        y={8 - h / 2}
        width={w}
        height={h}
        rx="1"
        fill={active ? "var(--accent-soft)" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
      />
      {paper && <path d={`M${8 - w / 2 + 2} ${8 - h / 2 + 3}h${w - 4}M${8 - w / 2 + 2} ${8 - h / 2 + 5.5}h${w - 4}M${8 - w / 2 + 2} ${8 - h / 2 + 8}h${(w - 4) * 0.6}`} stroke="currentColor" strokeWidth="0.9" opacity="0.6" />}
    </svg>
  );
}

// Chooses how the writing screen shows the text: a free column, or sheets of
// a real paper size.
export default function PaperPicker({
  paper,
  pages,
  onChoose,
}: {
  paper: Paper | null;
  pages: number;
  onChoose: (id: PaperId | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

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

  function choose(id: PaperId | null) {
    onChoose(id);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        title="Sayfa görünümü"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm transition-colors ${
          open || paper ? "bg-accent-soft/70 text-foreground" : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
        }`}
      >
        <SheetIcon paper={paper} />
        <span className="hidden sm:inline">{paper ? paper.label : "Sayfa"}</span>
        {paper && <span className="hidden text-xs tabular-nums text-muted xl:inline">· {pages} sayfa</span>}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Sayfa görünümü"
          className="menu-pop absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-surface p-1.5 shadow-[0_24px_50px_-24px_rgba(15,25,57,0.45)]"
          style={{ transformOrigin: "100% 0" }}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Sayfa görünümü
          </p>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={paper === null}
            onClick={() => choose(null)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm ${
              paper === null ? "bg-accent-soft/70 font-medium" : "hover:bg-accent-soft/40"
            }`}
          >
            <SheetIcon paper={null} active={paper === null} />
            <span className="flex-1">Serbest</span>
            <span className="text-xs text-muted">ekran genişliği</span>
          </button>
          <div className="my-1 h-px bg-border" />
          {PAPERS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={paper?.id === option.id}
              onClick={() => choose(option.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm ${
                paper?.id === option.id ? "bg-accent-soft/70" : "hover:bg-accent-soft/40"
              }`}
            >
              <SheetIcon paper={option} active={paper?.id === option.id} />
              <span className="w-7 font-medium">{option.label}</span>
              <span className="flex-1 truncate text-xs text-muted">{option.note}</span>
              <span className="text-[11px] tabular-nums text-muted">
                {option.width}×{option.height}
              </span>
            </button>
          ))}
          <p className="px-2.5 pb-1.5 pt-2 text-[11px] leading-snug text-muted">
            Her sayfa, o boyutta basılınca bir sayfa eder: kenar boşlukları ve yazı boyu ona göre.
          </p>
        </div>
      )}
    </div>
  );
}

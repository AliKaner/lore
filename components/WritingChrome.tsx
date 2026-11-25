"use client";

import { useEffect, useState } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import BookTitleEditor from "@/components/BookTitleEditor";
import type { NoteEntry } from "@/lib/editorExtensions";

// Small pieces of the writing screen's top bar: the writing's settings and
// the drawer of private notes.

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BookSettingsButton({ book }: { book: Doc<"books"> }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Yazı ayarları"
        title="Yazı ayarları"
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          open ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
        }`}
      >
        <GearIcon />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Kapat"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="menu-pop absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-xl border border-border bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(15,25,57,0.45)]">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sapphire">
              Yazı ayarları
            </p>
            <BookTitleEditor book={book} />
            <p className="-mt-3 text-xs leading-relaxed text-muted">
              Gizli bir yazıyı yalnızca sen görürsün. Herkese açınca, bağlantısını
              gönderdiğin kişi okuyabilir.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export function NotesDrawer({
  notes,
  open,
  onClose,
  onGo,
}: {
  notes: NoteEntry[];
  open: boolean;
  onClose: () => void;
  onGo: (pos: number) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <aside
      aria-label="Notların"
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-y-0 right-0 z-50 flex w-[min(22rem,100vw)] flex-col border-l border-border bg-surface transition-[translate,visibility,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open
          ? "visible translate-x-0 shadow-[-24px_0_60px_-40px_rgba(15,25,57,0.5)]"
          : "invisible translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-caramel">
            Yalnızca sen görürsün
          </p>
          <h2 className="font-display text-2xl">Notların</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Notları kapat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft/60 hover:text-foreground"
        >
          ✕
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="px-5 py-6 text-sm leading-relaxed text-muted">
          Henüz not yok. Metinde bir yeri seç ya da sağ tıkla, “Not”u seç.
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto px-3 py-3">
          {notes.map((entry) => (
            <li key={entry.from}>
              <button
                type="button"
                onClick={() => onGo(entry.from + 1)}
                className="w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-caramel-soft/60"
              >
                <span className="author-note line-clamp-2 px-0.5 font-display text-[15px] italic">
                  {entry.excerpt}
                </span>
                <span className="mt-1.5 block text-sm leading-snug text-foreground">{entry.note}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

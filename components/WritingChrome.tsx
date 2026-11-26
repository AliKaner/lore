"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import BookTitleEditor from "@/components/BookTitleEditor";
import { ChapterReader } from "@/components/Editor";
import type { NoteEntry } from "@/lib/editorExtensions";
import { intlLocale, useI18n, useT, type Locale } from "@/lib/i18n";

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
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // A writing still called "Başlıksız …" asks for its name right here.
  const untitled = book.title.startsWith("Başlıksız") || book.title.startsWith("Untitled");
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={untitled ? t("Yazına ad ver") : t("Yazı ayarları")}
        title={t("Yazı ayarları")}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full transition-colors ${
          untitled ? "border border-dashed border-caramel px-3 text-sm" : "w-9"
        } ${open ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft/60 hover:text-foreground"}`}
      >
        <GearIcon />
        {untitled && <span className="hidden text-foreground lg:inline">{t("Ad ver")}</span>}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label={t("Kapat")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="menu-pop absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-xl border border-border bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(15,25,57,0.45)]">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sapphire">
              {t("Yazı ayarları")}
            </p>
            <BookTitleEditor book={book} />
            <p className="-mt-3 text-xs leading-relaxed text-muted">
              {t("Gizli bir yazıyı yalnızca sen görürsün. Herkese açınca, bağlantısını gönderdiğin kişi okuyabilir.")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Asked when publishing in a private writing: publishing alone doesn't let
// anyone read it.
export function PublishPrivateDialog({
  kindLabel,
  onChoose,
  onCancel,
}: {
  kindLabel: string;
  onChoose: (open: boolean, dontAskAgain: boolean) => void;
  onCancel: () => void;
}) {
  const [dontAsk, setDontAsk] = useState(false);
  const t = useT();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={t("Vazgeç")}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-private-title"
        className="menu-pop relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_30px_80px_-30px_rgba(15,25,57,0.6)] sm:p-7"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-caramel">
          {kindLabel} · gizli
        </p>
        <h2 id="publish-private-title" className="mt-2 font-display text-[1.75rem] leading-tight">
          {t("Yazın şu an gizli")}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          {t("Yayınladığın bölümü şimdilik yalnızca sen görürsün. Bağlantısını gönderdiğin kişi de okuyabilsin mi?")}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            autoFocus
            onClick={() => onChoose(true, false)}
            className="flex items-center justify-between gap-3 rounded-xl bg-accent px-5 py-3.5 text-left text-accent-contrast transition-colors hover:bg-accent-hover"
          >
            <span>
              <span className="block font-medium">{t("Bağlantıyla aç ve yayınla")}</span>
              <span className="block text-xs opacity-80">{t("Bağlantısı olan herkes okuyabilir")}</span>
            </span>
            <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            onClick={() => onChoose(false, dontAsk)}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-5 py-3.5 text-left transition-colors hover:border-border-hover"
          >
            <span>
              <span className="block font-medium text-foreground">{t("Gizli kalsın, yine de yayınla")}</span>
              <span className="block text-xs text-muted">{t("Bölüm “yayında” sayılır ama yalnızca sen görürsün")}</span>
            </span>
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={dontAsk}
              onChange={(event) => setDontAsk(event.target.checked)}
              className="accent-[var(--caramel)]"
            />
            {t("Bu yazı için bir daha sorma")}
          </label>
          <button type="button" onClick={onCancel} className="text-sm text-muted underline underline-offset-4">
            {t("Vazgeç")}
          </button>
        </div>
      </div>
    </div>
  );
}

function dayLabel(at: number, t: (text: string) => string, locale: Locale) {
  const day = new Date(at);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (day.toDateString() === today.toDateString()) return t("Bugün");
  if (day.toDateString() === yesterday.toDateString()) return t("Dün");
  return day.toLocaleDateString(intlLocale(locale), { day: "numeric", month: "long", year: "numeric" });
}

function timeLabel(at: number, locale: Locale) {
  return new Date(at).toLocaleTimeString(intlLocale(locale), { hour: "2-digit", minute: "2-digit" });
}

// Earlier states of the chapter: pick one, read it, bring it back. Bringing
// a version back only fills the editor; nothing is overwritten until it is
// saved, and the text it replaces becomes a version of its own.
export function HistoryDrawer({
  chapterId,
  open,
  onClose,
  onRestore,
}: {
  chapterId: Id<"chapters"> | undefined;
  open: boolean;
  onClose: () => void;
  onRestore: (version: { title: string; content: string }) => void;
}) {
  const versions = useQuery(api.versions.list, chapterId && open ? { chapterId } : "skip");
  const [selectedId, setSelectedId] = useState<Id<"chapterVersions"> | null>(null);
  const selected = useQuery(api.versions.get, selectedId ? { versionId: selectedId } : "skip");
  const { t, locale } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedId) setSelectedId(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, selectedId]);

  const groups: { day: string; items: NonNullable<typeof versions> }[] = [];
  for (const version of versions ?? []) {
    const day = dayLabel(version.createdAt, t, locale);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(version);
    else groups.push({ day, items: [version] });
  }

  return (
    <aside
      aria-label={t("Sürüm geçmişi")}
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-y-0 right-0 z-50 flex w-[min(28rem,100vw)] flex-col border-l border-border bg-surface transition-[translate,visibility,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? "visible translate-x-0 shadow-[-24px_0_60px_-40px_rgba(15,25,57,0.5)]" : "invisible translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sapphire">
            {selectedId ? t("Önizleme") : t("Her şey saklanıyor")}
          </p>
          <h2 className="font-display text-2xl">{selectedId ? t("Eski bir sürüm") : t("Geçmiş")}</h2>
        </div>
        <button
          type="button"
          onClick={() => (selectedId ? setSelectedId(null) : onClose())}
          aria-label={selectedId ? t("Listeye dön") : t("Geçmişi kapat")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft/60 hover:text-foreground"
        >
          {selectedId ? "←" : "✕"}
        </button>
      </div>

      {selectedId ? (
        selected === undefined ? (
          <p className="px-5 py-6 text-sm text-muted">{t("Yükleniyor…")}</p>
        ) : selected === null ? (
          <p className="px-5 py-6 text-sm text-muted">{t("Bu sürüm artık yok.")}</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-xs text-muted">
                {dayLabel(selected.createdAt, t, locale)} · {timeLabel(selected.createdAt, locale)} ·{" "}
                {t("{n} kelime", { n: selected.words.toLocaleString(intlLocale(locale)) })}
              </p>
              <h3 className="mt-2 font-display text-2xl">{selected.title}</h3>
              <div className="mt-4 text-[15px]">
                <ChapterReader key={selected._id} content={selected.content} />
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-border px-5 py-4">
              <p className="mr-auto text-xs leading-snug text-muted">
                {t("Şu anki metnin de geçmişe eklenir; istersen geri dönebilirsin.")}
              </p>
              <button
                type="button"
                onClick={() => {
                  onRestore({ title: selected.title, content: selected.content });
                  setSelectedId(null);
                }}
                className="inline-flex h-9 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
              >
                {t("Bu sürüme dön")}
              </button>
            </div>
          </>
        )
      ) : !chapterId ? (
        <p className="px-5 py-6 text-sm leading-relaxed text-muted">
          {t("Yazdıkça burada önceki hallerin birikir: en fazla on dakikada bir ve her yayında bir.")}
        </p>
      ) : versions === undefined ? (
        <p className="px-5 py-6 text-sm text-muted">{t("Yükleniyor…")}</p>
      ) : versions.length === 0 ? (
        <p className="px-5 py-6 text-sm leading-relaxed text-muted">
          {t("Henüz eski bir sürüm yok. Metni değiştirdikçe önceki hallerin burada birikir: en fazla on dakikada bir ve her yayında bir.")}
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {groups.map((group) => (
            <div key={group.day} className="mb-3">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {group.day}
              </p>
              <ul>
                {group.items.map((version) => (
                  <li key={version._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(version._id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-caramel-soft/60"
                    >
                      <span className="w-12 shrink-0 text-sm tabular-nums text-foreground">
                        {timeLabel(version.createdAt, locale)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">{version.title}</span>
                        <span className="block text-xs text-muted">
                          {t("{n} kelime", { n: version.words.toLocaleString(intlLocale(locale)) })}
                        </span>
                      </span>
                      {version.reason === "publish" && (
                        <span className="rounded-full bg-sapphire-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sapphire">
                          {t("Yayından önce")}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </aside>
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
  const t = useT();

  return (
    <aside
      aria-label={t("Notların")}
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
            {t("Yalnızca sen görürsün")}
          </p>
          <h2 className="font-display text-2xl">{t("Notların")}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Notları kapat")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft/60 hover:text-foreground"
        >
          ✕
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="px-5 py-6 text-sm leading-relaxed text-muted">
          {t("Henüz not yok. Metinde bir yeri seç ya da sağ tıkla, “Not”u seç.")}
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

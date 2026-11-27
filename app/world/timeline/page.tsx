"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { KindGlyph, errorText, eyebrow, type Chip } from "@/components/entity/shared";
import Loading from "@/components/Loading";
import { useToast } from "@/components/Toaster";
import { buttonPrimary } from "@/lib/ui";
import { useI18n } from "@/lib/i18n";
import { useEntityKinds } from "@/lib/localized";

type TimelineEvent = FunctionReturnType<typeof api.events.list>[number];
type Draft = {
  title: string;
  year: string;
  dateLabel: string;
  description: string;
  bookId: string;
  chapterId: string;
  entities: Chip[];
};

const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

// "24" from a birth year and the event's year, when both are plain numbers.
function ageAt(birthYear: string | null, year: number | null) {
  if (year === null || !birthYear) return null;
  const born = Number(birthYear.trim());
  if (!Number.isFinite(born)) return null;
  const age = year - born;
  return age >= 0 && age < 2000 ? age : null;
}

function Participants({
  value,
  onChange,
}: {
  value: Chip[];
  onChange: (value: Chip[]) => void;
}) {
  const mine = useQuery(api.entities.listMine, {});
  const kinds = useEntityKinds();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const chosen = new Set(value.map((c) => c._id));
  const options = (mine ?? [])
    .filter((e) => !chosen.has(e._id) && (query.trim() === "" || lower(e.name).includes(lower(query.trim()))))
    .slice(0, 6);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((chip) => (
          <span key={chip._id} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-0.5 pl-0.5 pr-1 text-sm">
            <KindGlyph kind={chip.kind} />
            {chip.name}
            <button
              type="button"
              aria-label={t("{name} bağlantısını kaldır", { name: chip.name })}
              onClick={() => onChange(value.filter((c) => c._id !== chip._id))}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-muted hover:bg-accent-soft"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("Karakter, yer ya da eşya ara…")}
        className="mt-2 h-9 w-full rounded-full border border-border bg-surface px-3 text-sm outline-none focus:border-accent"
      />
      {query.trim() !== "" && (
        <ul className="mt-1 overflow-hidden rounded-xl border border-border bg-surface">
          {options.length === 0 && <li className="px-3 py-2 text-sm text-muted">{t("Bulunamadı")}</li>}
          {options.map((e) => (
            <li key={e._id}>
              <button
                type="button"
                onClick={() => {
                  onChange([...value, { _id: e._id, kind: e.kind, name: e.name }]);
                  setQuery("");
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent-soft/60"
              >
                <KindGlyph kind={e.kind} />
                <span className="truncate">{e.name}</span>
                <span className="ml-auto text-xs text-muted">{kinds[e.kind].label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EventForm({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Draft;
  onSave: (draft: Draft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const books = useQuery(api.books.listMine, {});
  const chapters = useQuery(api.chapters.getTree, draft.bookId ? { bookId: draft.bookId as Id<"books"> } : "skip");
  const field = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-[15px] outline-none focus:border-accent";

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await onSave(draft);
        } finally {
          setBusy(false);
        }
      }}
      className="menu-pop rounded-2xl border border-border bg-surface p-5 shadow-[0_24px_60px_-36px_rgba(15,25,57,0.45)]"
    >
      <input
        autoFocus
        value={draft.title}
        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        placeholder={t("Ne oldu? (Kuzey Limanı yandı)")}
        className="w-full bg-transparent font-display text-2xl outline-none placeholder:text-muted/50"
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr]">
        <label className="text-sm text-muted">
          {t("Yıl")}
          <input
            type="number"
            value={draft.year}
            onChange={(event) => setDraft({ ...draft, year: event.target.value })}
            placeholder="318"
            className={`${field} mt-1 tabular-nums`}
          />
        </label>
        <label className="text-sm text-muted">
          {t("Tarih, kendi takviminde")}
          <input
            value={draft.dateLabel}
            onChange={(event) => setDraft({ ...draft, dateLabel: event.target.value })}
            placeholder={t("Ay Takvimi 318, ilkbahar")}
            className={`${field} mt-1`}
          />
        </label>
      </div>
      <label className="mt-3 block text-sm text-muted">
        {t("Ne oldu, kısaca")}
        <textarea
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          rows={3}
          className="mt-1 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-accent"
        />
      </label>
      <div className="mt-3 text-sm text-muted">
        {t("Kimler, nerede")}
        <div className="mt-1">
          <Participants value={draft.entities} onChange={(entities) => setDraft({ ...draft, entities })} />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-muted">
          {t("Hangi yazıda")}
          <select
            value={draft.bookId}
            onChange={(event) => setDraft({ ...draft, bookId: event.target.value, chapterId: "" })}
            className={`${field} mt-1`}
          >
            <option value="">{t("Yazıya bağlı değil")}</option>
            {(books ?? []).map((book) => (
              <option key={book._id} value={book._id}>
                {book.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          {t("Hangi bölümde anlatılıyor")}
          <select
            value={draft.chapterId}
            disabled={!draft.bookId}
            onChange={(event) => setDraft({ ...draft, chapterId: event.target.value })}
            className={`${field} mt-1 disabled:opacity-50`}
          >
            <option value="">—</option>
            {(chapters ?? []).map((chapter) => (
              <option key={chapter._id} value={chapter._id}>
                {chapter.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button type="submit" disabled={busy || !draft.title.trim()} className={`${buttonPrimary} disabled:opacity-50`}>
          {busy ? t("Kaydediliyor…") : t("Kaydet")}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-muted hover:text-foreground">
          {t("Vazgeç")}
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="ml-auto text-sm text-muted underline decoration-dotted underline-offset-4 hover:text-red-700">
            {t("Olayı sil")}
          </button>
        )}
      </div>
    </form>
  );
}

const EMPTY: Draft = { title: "", year: "", dateLabel: "", description: "", bookId: "", chapterId: "", entities: [] };

function toDraft(event: TimelineEvent): Draft {
  return {
    title: event.title,
    year: event.year === null ? "" : String(event.year),
    dateLabel: event.dateLabel ?? "",
    description: event.description ?? "",
    bookId: event.bookId ?? "",
    chapterId: event.chapterId ?? "",
    entities: event.entities.map((e) => ({ _id: e._id, kind: e.kind, name: e.name })),
  };
}

function TimelinePage() {
  const params = useSearchParams();
  const { t, num } = useI18n();
  const showToast = useToast();
  const [bookFilter, setBookFilter] = useState(params.get("book") ?? "");
  const events = useQuery(api.events.list, bookFilter ? { bookId: bookFilter as Id<"books"> } : {});
  const books = useQuery(api.books.listMine, {});
  const create = useMutation(api.events.create);
  const update = useMutation(api.events.update);
  const remove = useMutation(api.events.remove);
  const move = useMutation(api.events.move);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Id<"events"> | null>(null);

  const groups = useMemo(() => {
    const out: { key: string; year: number | null; items: TimelineEvent[] }[] = [];
    for (const event of events ?? []) {
      const last = out[out.length - 1];
      if (last && last.year === event.year) last.items.push(event);
      else out.push({ key: String(event.year), year: event.year, items: [event] });
    }
    return out;
  }, [events]);

  async function save(draft: Draft, eventId?: Id<"events">) {
    const year = draft.year.trim() === "" ? null : Number(draft.year);
    const payload = {
      title: draft.title,
      description: draft.description,
      dateLabel: draft.dateLabel,
      year,
      entityIds: draft.entities.map((e) => e._id),
    };
    try {
      if (eventId) {
        await update({
          eventId,
          ...payload,
          bookId: draft.bookId ? (draft.bookId as Id<"books">) : null,
          chapterId: draft.chapterId ? (draft.chapterId as Id<"chapters">) : null,
        });
        setEditing(null);
      } else {
        await create({
          ...payload,
          ...(draft.bookId ? { bookId: draft.bookId as Id<"books"> } : {}),
          ...(draft.chapterId ? { chapterId: draft.chapterId as Id<"chapters"> } : {}),
        });
        setAdding(false);
      }
    } catch (err) {
      showToast(errorText(err));
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/world" className="text-sm text-muted hover:text-foreground">
        ← {t("Evren")}
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`${eyebrow} text-caramel`}>{t("Evrenin")}</p>
          <h1 className="mt-1 font-display text-5xl leading-tight">{t("Zaman çizelgesi")}</h1>
          <p className="mt-2 max-w-xl text-muted">
            {t("Ne zaman ne oldu, kimler oradaydı, hangi bölümde anlatılıyor. Doğum yılı girdiğin karakterlerin o günkü yaşı kendiliğinden yazılır.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={bookFilter}
            onChange={(event) => setBookFilter(event.target.value)}
            aria-label={t("Yazıya göre süz")}
            className="h-10 rounded-full border border-border bg-surface px-3 text-sm"
          >
            <option value="">{t("Bütün yazılar")}</option>
            {(books ?? []).map((book) => (
              <option key={book._id} value={book._id}>
                {book.title}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setAdding(true)} className={buttonPrimary}>
            {t("+ Olay ekle")}
          </button>
        </div>
      </div>

      {adding && (
        <div className="mt-8">
          <EventForm initial={{ ...EMPTY, bookId: bookFilter }} onSave={(draft) => save(draft)} onCancel={() => setAdding(false)} />
        </div>
      )}

      {events === undefined ? (
        <div className="mt-10">
          <Loading />
        </div>
      ) : events.length === 0 && !adding ? (
        <div className="mt-14 rounded-2xl border border-dashed border-border-hover px-6 py-14 text-center">
          <p className="font-display text-2xl">{t("Zaman çizelgen boş")}</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            {t("İlk olayı ekle: bir doğum, bir savaş, bir buluşma. Yıl verirsen sıraya kendiliğinden girer.")}
          </p>
          <button type="button" onClick={() => setAdding(true)} className={`${buttonPrimary} mt-6`}>
            {t("+ Olay ekle")}
          </button>
        </div>
      ) : (
        <ol className="relative mt-12">
          <span aria-hidden="true" className="absolute bottom-2 left-[6.25rem] top-2 w-px bg-border sm:left-[8.25rem]" />
          {groups.map((group) => (
            <li key={group.key} className="relative mb-8">
              <div className="grid grid-cols-[5rem_1fr] gap-x-10 sm:grid-cols-[7rem_1fr]">
                <p className="pt-3 text-right font-display text-2xl tabular-nums text-foreground/80">
                  {group.year === null ? <span className="text-base text-muted">{t("Tarihsiz")}</span> : num(group.year)}
                </p>
                <ul className="flex flex-col gap-3">
                  {group.items.map((event, index) => (
                    <li key={event._id} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[1.625rem] top-5 h-3 w-3 rounded-full border-2 border-surface bg-caramel shadow-[0_0_0_3px_var(--caramel-soft)]"
                      />
                      {editing === event._id ? (
                        <EventForm
                          initial={toDraft(event)}
                          onSave={(draft) => save(draft, event._id)}
                          onCancel={() => setEditing(null)}
                          onDelete={() => {
                            if (window.confirm(t("Bu olay silinsin mi?"))) {
                              void remove({ eventId: event._id }).catch((err) => showToast(errorText(err)));
                            }
                          }}
                        />
                      ) : (
                        <article className="group rounded-2xl border border-border bg-surface px-5 py-4 transition-colors hover:border-border-hover">
                          <div className="flex items-start gap-3">
                            <button type="button" onClick={() => setEditing(event._id)} className="min-w-0 flex-1 text-left">
                              {event.dateLabel && <p className="text-xs text-caramel-strong">{event.dateLabel}</p>}
                              <h2 className="font-display text-xl leading-snug group-hover:text-accent">{event.title}</h2>
                            </button>
                            <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              {index > 0 && (
                                <button type="button" aria-label={t("Yukarı taşı")} onClick={() => void move({ eventId: event._id, direction: "up" })} className="h-7 w-7 rounded-full text-muted hover:bg-accent-soft">
                                  ↑
                                </button>
                              )}
                              {index < group.items.length - 1 && (
                                <button type="button" aria-label={t("Aşağı taşı")} onClick={() => void move({ eventId: event._id, direction: "down" })} className="h-7 w-7 rounded-full text-muted hover:bg-accent-soft">
                                  ↓
                                </button>
                              )}
                            </div>
                          </div>
                          {event.description && <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{event.description}</p>}
                          {event.entities.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {event.entities.map((entity) => {
                                const age = entity.kind === "character" ? ageAt(entity.birthYear, event.year) : null;
                                return (
                                  <Link
                                    key={entity._id}
                                    href={`/world/${entity._id}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border py-0.5 pl-0.5 pr-2.5 text-sm hover:border-border-hover hover:text-accent"
                                  >
                                    <KindGlyph kind={entity.kind} />
                                    {entity.name}
                                    {age !== null && <span className="text-xs text-muted">· {t("{n} yaşında", { n: num(age) })}</span>}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                          {(event.bookTitle || event.chapterTitle) && (
                            <p className="mt-3 text-xs text-muted">
                              {event.chapterId && event.bookId ? (
                                <Link href={`/book/${event.bookId}/chapter/${event.chapterId}`} className="hover:text-accent">
                                  {event.bookTitle} · {event.chapterTitle}
                                </Link>
                              ) : event.bookId ? (
                                <Link href={`/book/${event.bookId}`} className="hover:text-accent">
                                  {event.bookTitle}
                                </Link>
                              ) : null}
                            </p>
                          )}
                        </article>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TimelinePage />
    </Suspense>
  );
}

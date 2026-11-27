"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Loading from "@/components/Loading";
import NotFoundState from "@/components/NotFoundState";
import { useToast } from "@/components/Toaster";
import { errorText } from "@/components/entity/shared";
import { buttonPrimary } from "@/lib/ui";
import { useI18n } from "@/lib/i18n";

type Card = NonNullable<FunctionReturnType<typeof api.planCards.list>>[number];
type Color = Card["color"];
type Status = Card["status"];

const COLORS: { id: Color; pin: string; paper: string }[] = [
  { id: "plain", pin: "bg-ink/70", paper: "bg-[#fffdf6] dark:bg-surface" },
  { id: "caramel", pin: "bg-caramel", paper: "bg-[#fdf3e3] dark:bg-[#3a3020]" },
  { id: "sapphire", pin: "bg-sapphire", paper: "bg-[#eef1fb] dark:bg-[#1c2a5a]" },
  { id: "rose", pin: "bg-[#d9667f]", paper: "bg-[#fcebef] dark:bg-[#40222b]" },
  { id: "sage", pin: "bg-[#6f9c7d]", paper: "bg-[#ecf4ee] dark:bg-[#1f3326]" },
];
const STATUSES: { id: Status; label: string; tone: string }[] = [
  { id: "idea", label: "Fikir", tone: "bg-accent-soft text-accent" },
  { id: "writing", label: "Yazılıyor", tone: "bg-caramel-soft text-caramel-strong" },
  { id: "revise", label: "Gözden geçir", tone: "bg-[#fcebef] text-[#a23a55] dark:bg-[#40222b] dark:text-[#f0a3b4]" },
  { id: "done", label: "Bitti", tone: "bg-[#ecf4ee] text-[#2f6b44] dark:bg-[#1f3326] dark:text-[#9fd2ad]" },
];
const colorOf = (id: Color) => COLORS.find((c) => c.id === id) ?? COLORS[0];
const statusOf = (id: Status) => STATUSES.find((s) => s.id === id) ?? STATUSES[0];

function CardEditor({
  card,
  bookId,
  onClose,
}: {
  card: Card;
  bookId: Id<"books">;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const update = useMutation(api.planCards.update);
  const remove = useMutation(api.planCards.remove);
  const chapters = useQuery(api.chapters.getTree, { bookId });
  const showToast = useToast();
  const [title, setTitle] = useState(card.title);
  const [synopsis, setSynopsis] = useState(card.synopsis ?? "");

  const save = (patch: Parameters<typeof update>[0]) => void update(patch).catch((err) => showToast(errorText(err)));

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label={t("Kapat")} onClick={onClose} className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" className={`menu-pop relative w-full max-w-lg rounded-2xl border border-border p-6 shadow-[0_30px_80px_-30px_rgba(15,25,57,0.6)] ${colorOf(card.color).paper}`}>
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => title.trim() && title !== card.title && save({ cardId: card._id, title })}
          className="w-full bg-transparent font-display text-3xl outline-none"
        />
        <textarea
          value={synopsis}
          onChange={(event) => setSynopsis(event.target.value)}
          onBlur={() => synopsis !== (card.synopsis ?? "") && save({ cardId: card._id, synopsis })}
          placeholder={t("Bu sahnede ne oluyor? Kim ne istiyor, ne değişiyor?")}
          rows={5}
          className="mt-3 w-full resize-y bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted/60"
        />
        <p className="mt-4 text-sm text-muted">{t("Durum")}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={card.status === s.id}
              onClick={() => save({ cardId: card._id, status: s.id })}
              className={`rounded-full px-3 py-1 text-sm ${card.status === s.id ? s.tone + " font-medium" : "text-muted hover:text-foreground"}`}
            >
              {t(s.label)}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">{t("Renk")}</p>
        <div className="mt-1.5 flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-label={c.id}
              aria-pressed={card.color === c.id}
              onClick={() => save({ cardId: card._id, color: c.id })}
              className={`h-7 w-7 rounded-full border ${c.paper} ${card.color === c.id ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "border-border"}`}
            >
              <span className={`mx-auto block h-2.5 w-2.5 rounded-full ${c.pin}`} />
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm text-muted">
          {t("Bağlı bölüm")}
          <select
            value={card.chapterId ?? ""}
            onChange={(event) => save({ cardId: card._id, chapterId: event.target.value ? (event.target.value as Id<"chapters">) : null })}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-[15px]"
          >
            <option value="">—</option>
            {(chapters ?? []).map((chapter) => (
              <option key={chapter._id} value={chapter._id}>
                {chapter.title}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={onClose} className={buttonPrimary}>
            {t("Tamam")}
          </button>
          {card.chapter && (
            <Link href={`/book/${bookId}/chapter/${card.chapter._id}/edit`} className="text-sm text-accent hover:underline">
              {t("Bölümü aç →")}
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(t("Bu kart silinsin mi?"))) return;
              void remove({ cardId: card._id }).then(onClose, (err) => showToast(errorText(err)));
            }}
            className="ml-auto text-sm text-muted underline decoration-dotted underline-offset-4 hover:text-red-700"
          >
            {t("Kartı sil")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BoardPage({ params }: { params: Promise<{ bookId: Id<"books"> }> }) {
  const { bookId } = use(params);
  const { t, num } = useI18n();
  const book = useQuery(api.books.get, { bookId });
  const cards = useQuery(api.planCards.list, { bookId });
  const create = useMutation(api.planCards.create);
  const move = useMutation(api.planCards.move).withOptimisticUpdate((store, args) => {
    const list = store.getQuery(api.planCards.list, { bookId });
    if (!list) return;
    const moving = list.find((c) => c._id === args.cardId);
    if (!moving) return;
    const rest = list.filter((c) => c._id !== args.cardId);
    const at = args.beforeId ? rest.findIndex((c) => c._id === args.beforeId) : rest.length;
    rest.splice(at < 0 ? rest.length : at, 0, moving);
    store.setQuery(api.planCards.list, { bookId }, rest);
  });
  const fromChapters = useMutation(api.planCards.fromChapters);
  const showToast = useToast();
  const [open, setOpen] = useState<Id<"planCards"> | null>(null);
  const [dragging, setDragging] = useState<Id<"planCards"> | null>(null);
  // Read on drop: the state may not have re-rendered yet between events.
  const draggingRef = useRef<Id<"planCards"> | null>(null);
  const [over, setOver] = useState<Id<"planCards"> | "end" | null>(null);
  const [newTitle, setNewTitle] = useState("");

  if (book === undefined || cards === undefined) return <Loading />;
  if (book === null || cards === null) return <NotFoundState />;

  const openCard = cards.find((c) => c._id === open) ?? null;
  const drop = (beforeId?: Id<"planCards">) => {
    const moving = draggingRef.current;
    if (moving && moving !== beforeId) {
      void move({ cardId: moving, ...(beforeId ? { beforeId } : {}) }).catch((err) => showToast(errorText(err)));
    }
    draggingRef.current = null;
    setDragging(null);
    setOver(null);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(#c9a77a22_1px,transparent_1px)] [background-size:14px_14px] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href={`/book/${bookId}`} className="text-sm text-muted hover:text-foreground">
          ← {book.title}
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl leading-tight">{t("Mantar pano")}</h1>
            <p className="mt-2 max-w-xl text-muted">
              {t("Her kart bir sahne ya da bölüm. Sürükleyip sırala, durumunu işaretle, bölüme bağla.")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {STATUSES.map((s) => (
              <span key={s.id} className={`rounded-full px-2.5 py-0.5 ${s.tone}`}>
                {t(s.label)} · {num(cards.filter((c) => c.status === s.id).length)}
              </span>
            ))}
          </div>
        </div>

        <form
          className="mt-6 flex max-w-xl gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const title = newTitle;
            if (!title.trim()) return;
            // Cleared at once, so the next card can be typed right away.
            setNewTitle("");
            try {
              await create({ bookId, title });
            } catch (err) {
              setNewTitle(title);
              showToast(errorText(err));
            }
          }}
        >
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder={t("Yeni kart: “Selin limana iner”")}
            className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-[15px] outline-none focus:border-accent"
          />
          <button type="submit" className={`${buttonPrimary} h-11 rounded-xl`}>
            {t("+ Kart")}
          </button>
        </form>

        {cards.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border-hover bg-surface/70 px-6 py-14 text-center">
            <p className="font-display text-2xl">{t("Pano boş")}</p>
            <p className="mx-auto mt-2 max-w-md text-muted">
              {t("Sahnelerini kart kart yaz ya da var olan bölümlerden kart oluştur.")}
            </p>
            <button
              type="button"
              onClick={() => void fromChapters({ bookId }).catch((err) => showToast(errorText(err)))}
              className="mt-5 rounded-full border border-border px-5 py-2 text-sm hover:border-accent hover:text-accent"
            >
              {t("Bölümlerden kart oluştur")}
            </button>
          </div>
        ) : (
          <ol className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, index) => {
              const color = colorOf(card.color);
              const status = statusOf(card.status);
              return (
                <li
                  key={card._id}
                  draggable
                  onDragStart={(event) => {
                    draggingRef.current = card._id;
                    setDragging(card._id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOver(card._id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    drop(card._id);
                  }}
                  className={`relative transition-transform ${dragging === card._id ? "opacity-40" : ""} ${
                    over === card._id && dragging !== card._id ? "translate-x-2" : ""
                  }`}
                  style={{ rotate: `${((index * 37) % 5) - 2}deg` }}
                >
                  {over === card._id && dragging && dragging !== card._id && (
                    <span aria-hidden="true" className="absolute -left-3 top-2 bottom-2 w-1 rounded-full bg-accent" />
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(card._id)}
                    className={`group relative block min-h-44 w-full cursor-grab rounded-md border border-border/80 px-5 pb-4 pt-6 text-left shadow-[0_14px_30px_-18px_rgba(15,25,57,0.5)] transition-shadow hover:shadow-[0_20px_40px_-18px_rgba(15,25,57,0.55)] active:cursor-grabbing ${color.paper}`}
                  >
                    <span aria-hidden="true" className={`absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full shadow-[0_2px_3px_rgba(0,0,0,0.35)] ${color.pin}`} />
                    <span className="block text-[11px] tabular-nums text-muted">{num(index + 1)}</span>
                    <span className="mt-0.5 block font-display text-xl leading-snug">{card.title}</span>
                    {card.synopsis && (
                      <span className="mt-2 line-clamp-4 block border-t border-dashed border-border pt-2 text-sm leading-relaxed text-foreground/80">
                        {card.synopsis}
                      </span>
                    )}
                    <span className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className={`rounded-full px-2 py-0.5 ${status.tone}`}>{t(status.label)}</span>
                      {card.chapter && (
                        <span className="truncate text-muted">
                          § {card.chapter.title} · {t("{n} kelime", { n: num(card.chapter.words) })}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
            <li
              onDragOver={(event) => {
                event.preventDefault();
                setOver("end");
              }}
              onDrop={(event) => {
                event.preventDefault();
                drop();
              }}
              className={`flex min-h-44 items-center justify-center rounded-md border-2 border-dashed text-sm text-muted ${
                over === "end" ? "border-accent text-accent" : "border-border/70"
              }`}
            >
              {dragging ? t("Sona bırak") : t("Kartları sürükleyerek sırala")}
            </li>
          </ol>
        )}
      </div>
      {openCard && <CardEditor key={openCard._id} card={openCard} bookId={bookId} onClose={() => setOpen(null)} />}
    </main>
  );
}

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { KindGlyph, errorText, useImageUpload } from "@/components/entity/shared";
import { useToast } from "@/components/Toaster";
import { GoalCard, LinkCard, PlanCard, TimelineCard } from "@/components/BoardWidgets";
import { useT } from "@/lib/i18n";

type Card = FunctionReturnType<typeof api.boards.list>[number];
type Side = "left" | "right";

const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

/* ---------- Shown or tucked away, remembered on this device ---------- */

const KEY = "booktion:panolar";
const listeners = new Set<() => void>();
function readHidden() {
  try {
    return window.localStorage.getItem(KEY) === "gizli";
  } catch {
    return false;
  }
}
function useBoardsHidden() {
  const hidden = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readHidden,
    () => false,
  );
  function setHidden(next: boolean) {
    try {
      if (next) window.localStorage.setItem(KEY, "gizli");
      else window.localStorage.removeItem(KEY);
    } catch {}
    for (const listener of listeners) listener();
  }
  return [hidden, setHidden] as const;
}

/* ---------- Saving text a moment after typing stops ---------- */

function useDebounced<T>(save: (value: T) => void, delay = 600) {
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<{ value: T } | null>(null);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (latest.current) saveRef.current(latest.current.value);
    },
    [],
  );
  return (value: T) => {
    latest.current = { value };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      latest.current = null;
      saveRef.current(value);
    }, delay);
  };
}

/* ---------- Cards ---------- */

function CardTools({ card, side }: { card: Card; side: Side }) {
  const move = useMutation(api.boards.move);
  const remove = useMutation(api.boards.remove);
  const t = useT();
  const button =
    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-muted hover:bg-accent-soft hover:text-foreground";
  return (
    <div className="absolute right-1.5 top-1.5 z-10 flex gap-0.5 rounded-full bg-surface/95 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      <button type="button" className={button} title={t("Yukarı")} aria-label={t("Yukarı taşı")} onClick={() => void move({ itemId: card._id, to: "up" })}>
        ↑
      </button>
      <button type="button" className={button} title={t("Aşağı")} aria-label={t("Aşağı taşı")} onClick={() => void move({ itemId: card._id, to: "down" })}>
        ↓
      </button>
      <button
        type="button"
        className={button}
        title={side === "left" ? t("Sağ panoya taşı") : t("Sol panoya taşı")}
        aria-label={side === "left" ? t("Sağ panoya taşı") : t("Sol panoya taşı")}
        onClick={() => void move({ itemId: card._id, to: side === "left" ? "right" : "left" })}
      >
        {side === "left" ? "→" : "←"}
      </button>
      <button type="button" className={`${button} hover:text-red-700`} title={t("Kaldır")} aria-label={t("Kartı kaldır")} onClick={() => void remove({ itemId: card._id })}>
        ✕
      </button>
    </div>
  );
}

function NoteCard({ card }: { card: Card }) {
  const update = useMutation(api.boards.update);
  const [text, setText] = useState(card.text);
  const t = useT();
  const save = useDebounced((value: string) => void update({ itemId: card._id, text: value }));
  return (
    <div className="rounded-xl border border-caramel/40 bg-caramel-soft/70 px-3.5 pb-3 pt-3">
      <textarea
        value={text}
        autoFocus={card.text === ""}
        onChange={(event) => {
          setText(event.target.value);
          save(event.target.value);
        }}
        placeholder={t("Not al… (ör. Selin denizden korkar)")}
        aria-label={t("Not")}
        rows={2}
        className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none [field-sizing:content] placeholder:text-muted/60"
      />
    </div>
  );
}

function ChecklistCard({ card }: { card: Card }) {
  const update = useMutation(api.boards.update);
  const [title, setTitle] = useState(card.title);
  const [items, setItems] = useState(card.items);
  const [draft, setDraft] = useState("");
  const t = useT();
  const saveTitle = useDebounced((value: string) => void update({ itemId: card._id, title: value }));
  const saveItems = useDebounced((value: Card["items"]) => void update({ itemId: card._id, items: value }), 300);

  function change(next: Card["items"]) {
    setItems(next);
    saveItems(next);
  }
  const done = items.filter((i) => i.done).length;

  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="flex items-baseline gap-2 pr-16">
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            saveTitle(event.target.value);
          }}
          placeholder={t("Yapılacaklar")}
          aria-label={t("Liste başlığı")}
          className="min-w-0 flex-1 bg-transparent font-display text-lg leading-tight outline-none placeholder:text-foreground/70"
        />
        {items.length > 0 && <span className="shrink-0 text-[11px] tabular-nums text-muted">{done}/{items.length}</span>}
      </div>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map((check, index) => (
          <li key={index} className="group/check flex items-start gap-2">
            <input
              type="checkbox"
              checked={check.done}
              onChange={() => change(items.map((c, i) => (i === index ? { ...c, done: !c.done } : c)))}
              aria-label={check.text}
              className="mt-1 accent-[var(--accent)]"
            />
            <input
              value={check.text}
              onChange={(event) => change(items.map((c, i) => (i === index ? { ...c, text: event.target.value } : c)))}
              aria-label={t("Madde")}
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${check.done ? "text-muted line-through" : ""}`}
            />
            <button
              type="button"
              aria-label={t("Maddeyi sil")}
              onClick={() => change(items.filter((_, i) => i !== index))}
              className="text-xs text-muted opacity-0 group-hover/check:opacity-100 focus:opacity-100 hover:text-red-700"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          change([...items, { text: draft.trim(), done: false }]);
          setDraft("");
        }}
        className="mt-1.5 flex items-center gap-2"
      >
        <span aria-hidden="true" className="text-sm text-muted">+</span>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("Madde ekle, ↵")}
          aria-label={t("Yeni madde")}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60"
        />
      </form>
    </div>
  );
}

function EntityCard({ card, onOpenEntity }: { card: Card; onOpenEntity: (id: Id<"entities">) => void }) {
  const entity = card.entity;
  const t = useT();
  if (!entity) {
    return <div className="rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted">{t("Bu kayıt silinmiş.")}</div>;
  }
  return (
    <button
      type="button"
      onClick={() => onOpenEntity(entity._id)}
      className="block w-full overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-border-hover"
    >
      {entity.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entity.coverUrl} alt="" className="aspect-[5/3] w-full object-cover" />
      )}
      <div className="px-3.5 py-3">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          <KindGlyph kind={entity.kind} />
          {t(entity.kindLabel)}
        </p>
        <p className="mt-1 font-display text-xl leading-tight">{entity.name}</p>
        {entity.summary && <p className="mt-1 text-[13px] italic leading-snug text-muted">{entity.summary}</p>}
        {entity.facts.length > 0 && (
          <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
            {entity.facts.map((fact) => (
              <div key={fact.label} className="contents">
                <dt className="text-muted">{t(fact.label)}</dt>
                <dd className="truncate">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </button>
  );
}

function ImageCard({ card }: { card: Card }) {
  if (!card.imageUrl) return null;
  return (
    <a href={card.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.imageUrl} alt="" className="w-full object-cover" />
    </a>
  );
}

/* ---------- Adding ---------- */

function AddMenu({ bookId, side }: { bookId: Id<"books">; side: Side }) {
  const add = useMutation(api.boards.add);
  const upload = useImageUpload();
  const showToast = useToast();
  const [mode, setMode] = useState<"closed" | "menu" | "entity">("closed");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = useQuery(api.entities.listMine, mode === "entity" ? {} : "skip");
  const boxRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    if (mode === "closed") return;
    const onDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setMode("closed");
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [mode]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      setMode("closed");
      setQuery("");
    } catch (err) {
      showToast(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const option =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent-soft/50";
  const matches = (mine ?? []).filter((e) => !query || lower(e.name).includes(lower(query))).slice(0, 8);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setMode(mode === "closed" ? "menu" : "closed")}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-hover py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {busy ? t("Ekleniyor…") : t("+ Panoya ekle")}
      </button>
      {mode !== "closed" && (
        <div className="menu-pop absolute inset-x-0 bottom-full z-20 mb-2 rounded-xl border border-border bg-surface p-1.5 shadow-[0_20px_40px_-20px_rgba(15,25,57,0.45)]" style={{ transformOrigin: "50% 100%" }}>
          {mode === "menu" ? (
            <>
              <button type="button" className={option} onClick={() => void run(() => add({ bookId, side, kind: "note" }))}>
                <span aria-hidden="true" className="h-3 w-3 rounded-[3px] bg-caramel/70" /> {t("Not")}
              </button>
              <button type="button" className={option} onClick={() => void run(() => add({ bookId, side, kind: "checklist" }))}>
                <span aria-hidden="true" className="text-xs">☑</span> {t("Yapılacaklar")}
              </button>
              <button type="button" className={option} onClick={() => setMode("entity")}>
                <span aria-hidden="true" className="text-xs text-sapphire">✦</span> {t("Evrenden bir kayıt")}
              </button>
              <div className="my-1 h-px bg-border" />
              <button type="button" className={option} onClick={() => void run(() => add({ bookId, side, kind: "timeline" }))}>
                <span aria-hidden="true" className="text-xs text-caramel">⟶</span> {t("Zaman çizelgesi")}
              </button>
              <button type="button" className={option} onClick={() => void run(() => add({ bookId, side, kind: "plan" }))}>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-caramel" /> {t("Mantar pano")}
              </button>
              <button type="button" className={option} onClick={() => void run(() => add({ bookId, side, kind: "goal" }))}>
                <span aria-hidden="true" className="text-xs">◔</span> {t("Bugünkü hedef")}
              </button>
              <button type="button" className={option} onClick={() => void run(() => add({ bookId, side, kind: "link" }))}>
                <span aria-hidden="true" className="text-xs">↗</span> {t("Kaynak bağlantısı")}
              </button>
              <div className="my-1 h-px bg-border" />
              <label className={`${option} cursor-pointer`}>
                <span aria-hidden="true" className="text-xs">▧</span> {t("Görsel")}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void run(async () => add({ bookId, side, kind: "image", storageId: await upload(file) }));
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Karakter, yer, ülke ara…")}
                aria-label={t("Evreninde ara")}
                className="mb-1 h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-accent"
              />
              {mine === undefined ? null : matches.length === 0 ? (
                <p className="px-2.5 py-1.5 text-xs text-muted">{t("Evreninde böyle bir kayıt yok.")}</p>
              ) : (
                matches.map((entity) => (
                  <button
                    key={entity._id}
                    type="button"
                    className={option}
                    onClick={() => void run(() => add({ bookId, side, kind: "entity", entityId: entity._id }))}
                  >
                    <KindGlyph kind={entity.kind} />
                    <span className="truncate">{entity.name}</span>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- The boards ---------- */

function Board({
  side,
  cards,
  bookId,
  width,
  onOpenEntity,
  onHide,
}: {
  side: Side;
  cards: Card[];
  bookId: Id<"books">;
  width: number;
  onOpenEntity: (id: Id<"entities">) => void;
  onHide: () => void;
}) {
  const t = useT();
  return (
    <aside
      aria-label={side === "left" ? t("Sol pano") : t("Sağ pano")}
      className={`fixed bottom-4 top-[4.75rem] z-30 flex flex-col gap-3 ${side === "left" ? "left-4" : "right-4"}`}
      style={{ width }}
    >
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          {side === "left" ? t("Sol pano") : t("Sağ pano")}
        </p>
        <button type="button" onClick={onHide} className="text-[11px] text-muted hover:text-foreground">
          {t("Panoları gizle")}
        </button>
      </div>
      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-1 [scrollbar-width:thin]">
        {cards.map((card) => (
          <div key={card._id} className="group relative">
            <CardTools card={card} side={side} />
            {card.kind === "note" && <NoteCard card={card} />}
            {card.kind === "checklist" && <ChecklistCard card={card} />}
            {card.kind === "entity" && <EntityCard card={card} onOpenEntity={onOpenEntity} />}
            {card.kind === "image" && <ImageCard card={card} />}
            {card.kind === "timeline" && <TimelineCard bookId={bookId} />}
            {card.kind === "plan" && <PlanCard bookId={bookId} />}
            {card.kind === "goal" && <GoalCard />}
            {card.kind === "link" && <LinkCard itemId={card._id} title={card.title ?? ""} url={card.text ?? ""} />}
          </div>
        ))}
        {cards.length === 0 && (
          <p className="px-1 text-xs leading-relaxed text-muted/80">
            {side === "left"
              ? t("Notlarını, bölüm planını buraya koy.")
              : t("Karakterlerin, haritan, ilham görsellerin burada dursun.")}
          </p>
        )}
      </div>
      <AddMenu bookId={bookId} side={side} />
    </aside>
  );
}

const MIN_WIDTH = 210;
const MAX_WIDTH = 320;

// The boards beside the page, when the screen has room for them.
export default function SideBoards({
  bookId,
  contentWidth,
  viewportWidth,
  onOpenEntity,
}: {
  bookId: Id<"books">;
  contentWidth: number;
  viewportWidth: number;
  onOpenEntity: (id: Id<"entities">) => void;
}) {
  const [hidden, setHidden] = useBoardsHidden();
  const t = useT();
  const cards = useQuery(api.boards.list, hidden ? "skip" : { bookId });
  const room = (viewportWidth - contentWidth) / 2 - 48;
  if (room < MIN_WIDTH) return null;
  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        className="fixed left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-lg border border-l-0 border-border bg-surface px-1.5 py-3 text-[11px] text-muted shadow-sm [writing-mode:vertical-rl] hover:text-foreground"
      >
        {t("Panoları göster")}
      </button>
    );
  }
  if (cards === undefined) return null;
  const width = Math.min(MAX_WIDTH, room);
  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <Board
          key={side}
          side={side}
          bookId={bookId}
          width={width}
          cards={cards.filter((card) => card.side === side)}
          onOpenEntity={onOpenEntity}
          onHide={() => setHidden(true)}
        />
      ))}
    </>
  );
}

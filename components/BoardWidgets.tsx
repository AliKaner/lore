"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useI18n } from "@/lib/i18n";

// Live cards for the side boards: they show what is already elsewhere in
// Booktion (the writing's timeline, its corkboard, today's goal), so the
// writer doesn't leave the page to look.

const shell = "rounded-xl border border-border bg-surface px-3.5 pb-3 pt-3";
const head = "mb-2 flex items-baseline justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted";

export function TimelineCard({ bookId }: { bookId: Id<"books"> }) {
  const { t, num } = useI18n();
  const events = useQuery(api.events.list, { bookId });
  return (
    <div className={shell}>
      <p className={head}>
        {t("Zaman çizelgesi")}
        <Link href={`/world/timeline?book=${bookId}`} className="normal-case tracking-normal text-accent">
          {t("Aç →")}
        </Link>
      </p>
      {events === undefined ? null : events.length === 0 ? (
        <p className="text-xs text-muted">{t("Bu yazıya bağlı olay yok.")}</p>
      ) : (
        <ol className="relative flex flex-col gap-2 border-l border-border pl-3">
          {events.slice(0, 8).map((event) => (
            <li key={event._id} className="relative text-sm leading-snug">
              <span aria-hidden="true" className="absolute -left-[1.06rem] top-1.5 h-2 w-2 rounded-full bg-caramel" />
              <span className="mr-1.5 font-display tabular-nums text-muted">{event.year === null ? "—" : num(event.year)}</span>
              {event.title}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const STATUS_DOT: Record<string, string> = {
  idea: "bg-accent",
  writing: "bg-caramel",
  revise: "bg-[#c0587a]",
  done: "bg-[#4f8f6a]",
};

export function PlanCard({ bookId }: { bookId: Id<"books"> }) {
  const { t } = useI18n();
  const cards = useQuery(api.planCards.list, { bookId });
  return (
    <div className={shell}>
      <p className={head}>
        {t("Mantar pano")}
        <Link href={`/book/${bookId}/board`} className="normal-case tracking-normal text-accent">
          {t("Aç →")}
        </Link>
      </p>
      {!cards || cards.length === 0 ? (
        <p className="text-xs text-muted">{t("Panoda kart yok.")}</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {cards.slice(0, 10).map((card, i) => (
            <li key={card._id} className="flex items-start gap-2 text-sm leading-snug">
              <span className="w-4 shrink-0 text-right text-[11px] tabular-nums text-muted">{i + 1}</span>
              <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[card.status]}`} />
              <span className={card.status === "done" ? "text-muted line-through decoration-1" : ""}>{card.title}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function GoalCard() {
  const { t, num } = useI18n();
  const today = useMemo(() => localToday(), []);
  const summary = useQuery(api.goals.summary, { today });
  if (!summary) return <div className={shell} />;
  const goal = summary.writingGoal;
  const words = summary.today.words;
  const share = goal ? Math.min(1, words / goal) : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className={`${shell} flex items-center gap-3`}>
      <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--caramel)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - share)} />
      </svg>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{t("Bugün")}</p>
        <p className="font-display text-xl tabular-nums">
          {num(words)}
          {goal ? <span className="text-sm text-muted"> / {num(goal)}</span> : null}
        </p>
        <p className="text-xs text-muted">
          {goal
            ? summary.writingStreak > 0
              ? t("{n} günlük seri", { n: summary.writingStreak })
              : t("kelime")
            : <Link href="/my-writing" className="text-accent">{t("Günlük hedef koy →")}</Link>}
        </p>
      </div>
    </div>
  );
}

export function LinkCard({ itemId, title, url }: { itemId: Id<"boardItems">; title: string; url: string }) {
  const { t } = useI18n();
  const update = useMutation(api.boards.update);
  const [editing, setEditing] = useState(!url);
  const [draft, setDraft] = useState({ title, url });
  const href = /^https?:\/\//iu.test(url) ? url : url ? `https://${url}` : "";
  let host = "";
  try {
    host = href ? new URL(href).hostname.replace(/^www\./u, "") : "";
  } catch {
    host = url;
  }
  if (editing) {
    return (
      <form
        className={`${shell} flex flex-col gap-2`}
        onSubmit={(event) => {
          event.preventDefault();
          void update({ itemId, title: draft.title, text: draft.url });
          setEditing(false);
        }}
      >
        <input
          autoFocus
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder={t("Başlık (ör. 1930’lar Berlin haritası)")}
          className="bg-transparent text-sm outline-none placeholder:text-muted/60"
        />
        <input
          value={draft.url}
          onChange={(event) => setDraft({ ...draft, url: event.target.value })}
          placeholder="https://…"
          className="bg-transparent text-xs text-muted outline-none placeholder:text-muted/60"
        />
        <button type="submit" className="self-end rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-contrast">
          {t("Kaydet")}
        </button>
      </form>
    );
  }
  return (
    <div className={shell}>
      <a href={href} target="_blank" rel="noreferrer noopener" className="block">
        <span className="block text-sm font-medium leading-snug hover:text-accent">{title || host}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">↗ {host}</span>
      </a>
      <button type="button" onClick={() => setEditing(true)} className="mt-1.5 text-[11px] text-muted hover:text-foreground">
        {t("Düzenle")}
      </button>
    </div>
  );
}

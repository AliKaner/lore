"use client";

import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useNow } from "@/lib/useNow";
import { useToast } from "@/components/Toaster";
import { useI18n, useT } from "@/lib/i18n";

type Summary = NonNullable<FunctionReturnType<typeof api.goals.summary>>;
type Kind = "writing" | "reading";

const CONFIG: Record<
  Kind,
  { label: string; unit: string; presets: number[]; min: number; max: number; step: number }
> = {
  writing: { label: "Yazma", unit: "kelime", presets: [250, 500, 1000, 2000], min: 50, max: 20000, step: 50 },
  reading: { label: "Okuma", unit: "dakika", presets: [10, 20, 30, 60], min: 5, max: 600, step: 5 },
};

const DAY_INITIALS = {
  tr: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
};
// "320 kelime" / "320 words", "12 dakika" / "12 minutes".
const amount = (kind: Kind) => (kind === "writing" ? "{n} kelime" : "{n} dakika");

// The writer's calendar day, as the server's daily totals are keyed.
export function localDay(now: number) {
  const date = new Date(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function useGoalSummary() {
  const { isAuthenticated } = useConvexAuth();
  const now = useNow();
  return useQuery(api.goals.summary, isAuthenticated && now ? { today: localDay(now) } : "skip");
}

/* ---------- Pieces ---------- */

export function GoalRing({
  value,
  goal,
  size = 64,
  stroke = 6,
  children,
}: {
  value: number;
  goal: number | null;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = goal ? Math.min(value / goal, 1) : 0;
  const done = goal !== null && value >= goal;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? "var(--caramel)" : "var(--accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          className="transition-[stroke-dashoffset,stroke] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </span>
  );
}

const Flame = ({ lit }: { lit: boolean }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 ${lit ? "text-caramel" : "text-muted/50"}`} fill="currentColor">
    <path d="M8.6 1c.3 2-1 3-2 4.2C5.4 6.6 4 8 4 10.2A4 4 0 0 0 8 14a4 4 0 0 0 4-4c0-1.6-.8-2.8-1.6-3.6.1 1-.3 1.9-1 2.2.3-1.9-.2-4.3-.8-7.6z" />
  </svg>
);

function WeekBars({ week, kind, goal, today }: { week: Summary["week"]; kind: Kind; goal: number | null; today: string }) {
  const values = week.map((d) => (kind === "writing" ? d.words : d.minutes));
  const top = Math.max(goal ?? 0, ...values, 1);
  const { t, num, locale } = useI18n();
  return (
    <div className="mt-4 flex items-end gap-1.5" aria-label={t("Son yedi gün")}>
      {week.map((d, i) => {
        const value = values[i];
        const met = goal !== null && value >= goal;
        const date = new Date(`${d.day}T12:00:00`);
        return (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${t(amount(kind), { n: num(value) })}`}>
            <div className="relative flex h-12 w-full items-end overflow-hidden rounded-md bg-accent-soft/50">
              {goal !== null && (
                <span aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-muted/40" style={{ bottom: `${(goal / top) * 100}%` }} />
              )}
              <span
                className={`w-full rounded-md transition-[height] duration-700 ${met ? "bg-caramel" : "bg-accent/45"}`}
                style={{ height: `${value === 0 ? 0 : Math.max(6, (value / top) * 100)}%` }}
              />
            </div>
            <span className={`text-[10px] ${d.day === today ? "font-semibold text-foreground" : "text-muted"}`}>
              {DAY_INITIALS[locale][date.getDay()]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GoalEditor({ kind, current, onDone }: { kind: Kind; current: number | null; onDone: () => void }) {
  const setGoals = useMutation(api.goals.setGoals);
  const showToast = useToast();
  const { t, num } = useI18n();
  const cfg = CONFIG[kind];
  const [value, setValue] = useState(String(current ?? cfg.presets[1]));

  async function save(goal: number | null) {
    try {
      await setGoals(kind === "writing" ? { writingGoal: goal } : { readingGoal: goal });
      onDone();
    } catch (err) {
      const message = err instanceof Error ? /Uncaught Error: ([^\n]+)/u.exec(err.message)?.[1] : null;
      showToast(message ?? t("Kaydedilemedi."));
    }
  }

  return (
    <div className="menu-pop mt-3">
      <div className="flex flex-wrap gap-1.5">
        {cfg.presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => void save(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              current === preset ? "border-accent bg-accent text-accent-contrast" : "border-border hover:border-border-hover"
            }`}
          >
            {num(preset)}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void save(Number(value));
        }}
      >
        <input
          type="number"
          inputMode="numeric"
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-label={kind === "writing" ? t("Günlük yazma hedefi (kelime)") : t("Günlük okuma hedefi (dakika)")}
          className="h-8 w-24 rounded-lg border border-border bg-background px-2 text-sm tabular-nums outline-none focus:border-accent"
        />
        <span className="text-sm text-muted">{kind === "writing" ? t("kelime / gün") : t("dakika / gün")}</span>
        <button className="ml-auto rounded-lg bg-accent px-3 py-1 text-sm text-accent-contrast hover:bg-accent-hover">{t("Kaydet")}</button>
      </form>
      <div className="mt-2 flex gap-3 text-xs">
        <button type="button" onClick={onDone} className="text-muted hover:text-foreground">
          {t("Vazgeç")}
        </button>
        {current !== null && (
          <button type="button" onClick={() => void save(null)} className="text-muted hover:text-red-700">
            {t("Hedefi kaldır")}
          </button>
        )}
      </div>
    </div>
  );
}

function GoalHalf({ kind, summary, today }: { kind: Kind; summary: Summary; today: string }) {
  const cfg = CONFIG[kind];
  const { t, num } = useI18n();
  const goal = kind === "writing" ? summary.writingGoal : summary.readingGoal;
  const value = kind === "writing" ? summary.today.words : summary.today.minutes;
  const streakDays = kind === "writing" ? summary.writingStreak : summary.readingStreak;
  const [editing, setEditing] = useState(false);
  const done = goal !== null && value >= goal;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{t(cfg.label)}</p>
        {goal !== null && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-muted hover:text-foreground">
            {t("Düzenle")}
          </button>
        )}
      </div>
      {goal === null && !editing ? (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-muted">
            {kind === "writing"
              ? t("Her gün biraz yazmak, bitmiş bir kitabın en kısa yolu.")
              : t("Okudukça yazın da beslenir. Günde kaç dakika?")}
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-3 rounded-full border border-dashed border-border-hover px-3.5 py-1.5 text-sm hover:border-accent hover:text-accent"
          >
            {kind === "writing" ? t("+ Günlük yazma hedefi koy") : t("+ Günlük okuma hedefi koy")}
          </button>
        </div>
      ) : editing ? (
        <GoalEditor kind={kind} current={goal} onDone={() => setEditing(false)} />
      ) : (
        <>
          <div className="mt-3 flex items-center gap-4">
            <GoalRing value={value} goal={goal}>
              <span className={`text-xs font-semibold tabular-nums ${done ? "text-caramel-strong" : ""}`}>
                {done ? "✓" : `%${Math.floor((value / goal!) * 100)}`}
              </span>
            </GoalRing>
            <div className="min-w-0">
              <p className="font-display text-3xl leading-none tabular-nums">
                {num(value)}
                <span className="ml-1.5 font-sans text-sm text-muted">/ {t(amount(kind), { n: num(goal!) })}</span>
              </p>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted">
                <Flame lit={streakDays > 0} />
                {streakDays > 0 ? t("{n} günlük seri", { n: streakDays }) : done ? t("Bugün tamam") : t("Bugün seriyi başlat")}
              </p>
            </div>
          </div>
          <WeekBars week={summary.week} kind={kind} goal={goal} today={today} />
        </>
      )}
    </div>
  );
}

// The desk's goals card: today's progress, the streak and the last week.
export function GoalsCard({ stacked = false }: { stacked?: boolean }) {
  const summary = useGoalSummary();
  const now = useNow();
  const t = useT();
  if (!summary) return null;
  const today = localDay(now);
  return (
    <section
      aria-label={t("Günlük hedeflerin")}
      className={`grid overflow-hidden rounded-2xl border border-border bg-surface ${
        stacked ? "divide-y divide-border" : "mb-8 sm:grid-cols-2 sm:divide-x sm:divide-border max-sm:divide-y max-sm:divide-border"
      }`}
    >
      <GoalHalf kind="writing" summary={summary} today={today} />
      <GoalHalf kind="reading" summary={summary} today={today} />
    </section>
  );
}

/* ---------- On the writing and reading screens ---------- */

function useCelebrate(kind: Kind, reached: boolean, today: string) {
  const showToast = useToast();
  const t = useT();
  const was = useRef<boolean | null>(null);
  useEffect(() => {
    // Only a goal crossed while the page is open is celebrated.
    if (was.current === false && reached) {
      const key = `booktion:hedef:${kind}:${today}`;
      let shown = false;
      try {
        shown = window.localStorage.getItem(key) !== null;
        window.localStorage.setItem(key, "1");
      } catch {}
      if (!shown) {
        showToast(
          kind === "writing" ? t("Bugünkü yazma hedefine ulaştın. Eline sağlık!") : t("Bugünkü okuma hedefin tamam."),
          "success",
        );
      }
    }
    was.current = reached;
  }, [reached, kind, today, showToast, t]);
}

// A small ring in the writing screen's bar: today's words against the goal.
export function WritingGoalBadge() {
  const summary = useGoalSummary();
  const now = useNow();
  const { t, num } = useI18n();
  const goal = summary?.writingGoal ?? null;
  const words = summary?.today.words ?? 0;
  useCelebrate("writing", summary !== undefined && summary !== null && goal !== null && words >= goal, localDay(now));
  if (!summary || goal === null) return null;
  return (
    <span
      title={`${t("Bugün {done} / {goal} kelime", { done: num(words), goal: num(goal) })}${summary.writingStreak ? ` · ${t("{n} günlük seri", { n: summary.writingStreak })}` : ""}`}
      className="hidden items-center gap-1.5 text-xs tabular-nums text-muted xl:inline-flex"
    >
      <GoalRing value={words} goal={goal} size={18} stroke={3} />
      {num(words)}/{num(goal)}
    </span>
  );
}

const HEARTBEAT_MS = 30_000;
const IDLE_MS = 90_000;

// Counts reading time on a chapter page while the reader is there and
// active, and shows today's minutes against the goal.
export function ReadingTracker({ chapterId }: { chapterId: Id<"chapters"> }) {
  const { isAuthenticated } = useConvexAuth();
  const logReading = useMutation(api.goals.logReading);
  const summary = useGoalSummary();
  const now = useNow();
  const t = useT();
  const goal = summary?.readingGoal ?? null;
  const minutes = summary?.today.minutes ?? 0;
  useCelebrate("reading", summary !== undefined && summary !== null && goal !== null && minutes >= goal, localDay(now));

  useEffect(() => {
    if (!isAuthenticated) return;
    let lastActive = Date.now();
    const mark = () => {
      lastActive = Date.now();
    };
    const events = ["scroll", "pointermove", "keydown", "wheel", "touchstart"] as const;
    for (const name of events) window.addEventListener(name, mark, { passive: true });
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActive > IDLE_MS) return;
      void logReading({ chapterId, seconds: HEARTBEAT_MS / 1000 }).catch(() => {});
    }, HEARTBEAT_MS);
    return () => {
      window.clearInterval(timer);
      for (const name of events) window.removeEventListener(name, mark);
    };
  }, [isAuthenticated, chapterId, logReading]);

  if (!summary || goal === null) return null;
  return (
    <span
      title={`${t("Bugün {done} / {goal} dakika okudun", { done: minutes, goal })}${summary.readingStreak ? ` · ${t("{n} günlük seri", { n: summary.readingStreak })}` : ""}`}
      className="inline-flex items-center gap-1.5 text-xs tabular-nums text-muted"
    >
      <GoalRing value={minutes} goal={goal} size={18} stroke={3} />
      {t("Bugün {done}/{goal} dk", { done: minutes, goal })}
    </span>
  );
}

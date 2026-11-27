"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { intlLocale, useI18n } from "@/lib/i18n";

// A year of writing on one page, like a contribution graph: a square per
// day, darker the more words; then the rhythm behind it — streaks, the
// weekday and the hours the writer writes most.

const DAY_MS = 86_400_000;
const LEVELS = ["var(--border)", "color-mix(in srgb, var(--caramel) 35%, var(--surface))", "color-mix(in srgb, var(--caramel) 65%, var(--surface))", "var(--caramel)", "var(--caramel-strong)"];

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
const toDate = (day: string) => new Date(`${day}T00:00:00Z`);
const dayOf = (date: Date) => date.toISOString().slice(0, 10);

export default function WritingActivity() {
  const { t, num, locale } = useI18n();
  const today = useMemo(() => localToday(), []);
  const data = useQuery(api.goals.activity, { today });

  const view = useMemo(() => {
    if (!data) return null;
    const words = new Map(data.days.map((d) => [d.day, d.words]));
    // 53 columns ending this week; weeks start on Monday.
    const end = toDate(today);
    const mondayOffset = (end.getUTCDay() + 6) % 7;
    const start = new Date(end.getTime() - (52 * 7 + mondayOffset) * DAY_MS);
    const cells: { day: string; words: number; future: boolean }[] = [];
    for (let d = start; d.getTime() <= end.getTime() + (6 - mondayOffset) * DAY_MS; d = new Date(d.getTime() + DAY_MS)) {
      const day = dayOf(d);
      cells.push({ day, words: words.get(day) ?? 0, future: d.getTime() > end.getTime() });
    }
    const written = cells.filter((c) => !c.future && c.words > 0).map((c) => c.words).sort((a, b) => a - b);
    const q = (p: number) => written[Math.min(written.length - 1, Math.floor(written.length * p))] ?? 0;
    const cuts = [q(0.25), q(0.5), q(0.75)];
    const level = (n: number) => (n <= 0 ? 0 : n <= cuts[0] ? 1 : n <= cuts[1] ? 2 : n <= cuts[2] ? 3 : 4);

    // Streaks over the year.
    let longest = 0;
    let run = 0;
    for (const cell of cells) {
      if (cell.future) break;
      run = cell.words > 0 ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    let current = 0;
    for (let i = cells.findLastIndex((c) => !c.future); i >= 0; i--) {
      if (cells[i].words > 0) current += 1;
      else if (cells[i].day !== today) break;
    }
    const total = written.reduce((a, b) => a + b, 0);
    const weekdays = new Array<number>(7).fill(0);
    for (const cell of cells) weekdays[(toDate(cell.day).getUTCDay() + 6) % 7] += cell.words;
    const months: { col: number; label: string }[] = [];
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { month: "short", timeZone: "UTC" });
    for (let col = 0; col < Math.ceil(cells.length / 7); col++) {
      const first = toDate(cells[col * 7].day);
      if (first.getUTCDate() <= 7) months.push({ col, label: fmt.format(first) });
    }
    return { cells, level, longest, current, total, activeDays: written.length, weekdays, months };
  }, [data, today, locale]);

  if (!data || !view) return null;
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const bestWeekday = view.weekdays.indexOf(Math.max(...view.weekdays));
  const hourMax = Math.max(...data.hours);
  const bestHour = data.hours.indexOf(hourMax);
  const dateFmt = new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "long", timeZone: "UTC" });
  const columns = Math.ceil(view.cells.length / 7);
  const days = (n: number) => (n === 1 ? t("1 gün") : t("{n} gün", { n: num(n) }));

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl">{t("Yazma haritan")}</h2>
        <p className="text-sm text-muted">
          {view.activeDays === 1
            ? t("Son bir yılda {n} kelime, 1 gün", { n: num(view.total) })
            : t("Son bir yılda {n} kelime, {d} gün", { n: num(view.total), d: num(view.activeDays) })}
        </p>
      </div>

      <div className="mt-4">
        <div className="grid gap-[2px]" style={{ gridTemplateColumns: `1.6rem repeat(${columns}, minmax(0, 1fr))` }}>
          <span />
          {Array.from({ length: columns }, (_, col) => (
            <span key={col} className="h-4 overflow-visible whitespace-nowrap text-[10px] leading-4 text-muted">
              {view.months.find((m) => m.col === col)?.label ?? ""}
            </span>
          ))}
          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} className="contents">
              <span className="self-center pr-1 text-right text-[10px] leading-none text-muted">{row % 2 === 0 ? weekdayNames[row] : ""}</span>
              {Array.from({ length: columns }, (_, col) => {
                const cell = view.cells[col * 7 + row];
                if (!cell || cell.future) return <span key={col} />;
                return (
                  <span
                    key={col}
                    title={`${dateFmt.format(toDate(cell.day))}: ${t("{n} kelime", { n: num(cell.words) })}`}
                    className={`aspect-square w-full rounded-[2px] ${cell.day === today ? "ring-1 ring-accent" : ""}`}
                    style={{ background: LEVELS[view.level(cell.words)] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted">
        {t("Az")}
        {LEVELS.map((color) => (
          <span key={color} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: color }} />
        ))}
        {t("Çok")}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
        {[
          [t("Şu anki seri"), days(view.current)],
          [t("En uzun seri"), days(view.longest)],
          [t("Yazdığın günlerde ortalama"), t("{n} kelime", { n: num(view.activeDays ? Math.round(view.total / view.activeDays) : 0) })],
          [t("En verimli gün"), view.total > 0 ? weekdayNames[bestWeekday] : "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</dt>
            <dd className="mt-1 font-display text-xl">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted">{t("Haftanın günleri")}</p>
          <div className="mt-2 flex h-20 items-end gap-1.5">
            {view.weekdays.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span
                  title={t("{n} kelime", { n: num(n) })}
                  className="w-full rounded-t-[3px] bg-caramel/80"
                  style={{ height: `${Math.max(3, (n / Math.max(1, ...view.weekdays)) * 64)}px` }}
                />
                <span className="text-[10px] text-muted">{weekdayNames[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted">
            {hourMax > 0
              ? t("En çok {from}:00–{to}:00 arası yazıyorsun", { from: String(bestHour).padStart(2, "0"), to: String((bestHour + 1) % 24).padStart(2, "0") })
              : t("Günün saatleri")}
          </p>
          <div className="mt-2 flex h-20 items-end gap-[3px]">
            {data.hours.map((n, h) => (
              <div key={h} className="flex flex-1 flex-col items-center gap-1">
                <span
                  title={`${String(h).padStart(2, "0")}:00 · ${t("{n} kelime", { n: num(n) })}`}
                  className={`w-full rounded-t-[2px] ${h === bestHour && hourMax > 0 ? "bg-accent" : "bg-sapphire/60"}`}
                  style={{ height: `${Math.max(2, (n / Math.max(1, hourMax)) * 64)}px` }}
                />
                <span className="text-[9px] text-muted">{h % 6 === 0 ? String(h).padStart(2, "0") : ""}</span>
              </div>
            ))}
          </div>
          {hourMax === 0 && <p className="mt-1 text-xs text-muted">{t("Saatler bugünden itibaren sayılıyor.")}</p>}
        </div>
      </div>
    </section>
  );
}

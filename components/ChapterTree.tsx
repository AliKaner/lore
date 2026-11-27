"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useI18n } from "@/lib/i18n";

type Chapter = Doc<"chapters">;
type Row = { chapter: Chapter; lane: number; parentRow: number | null; branchStart: boolean };

const ROW = 52;
const LANE = 18;
const PAD = 18;
const COLLAPSED = 8;
// Lane colours: the main line in the accent, branches in the others.
const LANE_COLORS = ["var(--accent)", "var(--caramel)", "var(--sapphire)", "#c0587a", "#4f8f6a", "#8a6bd1"];
const laneColor = (lane: number) => LANE_COLORS[lane % LANE_COLORS.length];

// Rows in reading order, like `git log --graph`: each chapter, then the
// branches that leave from it (each in a lane of its own), then the main
// line going on. Lanes are reused once a branch has ended.
export function layoutGraph(chapters: Chapter[]): Row[] {
  const children = new Map<string, Chapter[]>();
  for (const chapter of chapters) {
    const key = chapter.parentChapterId ?? "root";
    children.set(key, [...(children.get(key) ?? []), chapter]);
  }
  for (const list of children.values()) {
    list.sort((a, b) => (a.isCanonical === b.isCanonical ? a.order - b.order : a.isCanonical ? -1 : 1));
  }
  const rows: Row[] = [];
  const busyUntil: number[] = [Infinity];
  const take = (from: number) => {
    for (let lane = 1; ; lane++) {
      if ((busyUntil[lane] ?? -1) < from) {
        busyUntil[lane] = Infinity;
        return lane;
      }
    }
  };
  const visit = (start: Chapter, lane: number, parentRow: number | null, branchStart: boolean) => {
    let chapter: Chapter | undefined = start;
    let parent = parentRow;
    let first = branchStart;
    while (chapter) {
      const row = rows.length;
      rows.push({ chapter, lane, parentRow: parent, branchStart: first });
      const [main, ...others]: Chapter[] = children.get(chapter._id) ?? [];
      for (const other of others) {
        const branchLane = take(row);
        visit(other, branchLane, row, true);
        busyUntil[branchLane] = rows.length - 1;
      }
      parent = row;
      first = false;
      chapter = main;
    }
  };
  const [root, ...otherRoots] = children.get("root") ?? [];
  if (root) visit(root, 0, null, false);
  for (const other of otherRoots) visit(other, take(rows.length), null, true);
  return rows;
}

export default function ChapterTree({
  chapters,
  bookId,
  original,
}: {
  chapters: Chapter[];
  bookId: Id<"books">;
  // A classic: chapters its importer holds are credited to the real author.
  original?: { ownerId: Id<"users">; author: string };
}) {
  const { t, num } = useI18n();
  const authors = useQuery(api.members.chapterAuthors, { bookId });
  const [expanded, setExpanded] = useState(false);
  const rows = layoutGraph(chapters);
  if (rows.length === 0) return <p className="text-sm text-muted">{t("Henüz bölüm yok.")}</p>;

  const lanes = Math.max(...rows.map((r) => r.lane)) + 1;
  const shown = expanded || rows.length <= COLLAPSED + 2 ? rows : rows.slice(0, COLLAPSED);
  const graphWidth = PAD * 2 + (lanes - 1) * LANE;
  const x = (lane: number) => PAD + lane * LANE;
  const y = (row: number) => row * ROW + ROW / 2;
  const branchCount = rows.filter((r) => r.branchStart).length;

  // Lines: straight down a lane, or a curve out of the parent's lane.
  const paths = shown
    .filter((r) => r.parentRow !== null)
    .map((r, i) => {
      const row = rows.indexOf(r);
      const parent = rows[r.parentRow!];
      const px = x(parent.lane);
      const py = y(r.parentRow!);
      const cx = x(r.lane);
      const cy = y(row);
      const d =
        parent.lane === r.lane
          ? `M${px},${py} V${cy}`
          : `M${px},${py} C${px},${py + ROW * 0.6} ${cx},${py + ROW * 0.2} ${cx},${py + ROW * 0.8} V${cy}`;
      return <path key={i} d={d} fill="none" stroke={laneColor(r.lane)} strokeWidth={2} strokeLinecap="round" />;
    });
  // The main line keeps going past the cut when the list is folded.
  const hidden = rows.length - shown.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted">
        <span>
          {t("{n} bölüm", { n: num(rows.length) })}
          {branchCount > 0 && ` · ${t("{n} dal", { n: num(branchCount) })}`}
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: laneColor(0) }} />
            {t("ana hat")}
          </span>
          {branchCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: laneColor(1) }} />
              {t("dallar")}
            </span>
          )}
        </span>
      </div>
      <div className="relative">
        <svg aria-hidden="true" className="absolute left-0 top-0" width={graphWidth} height={shown.length * ROW + (hidden ? ROW / 2 : 0)}>
          {paths}
          {hidden > 0 && (
            <path d={`M${x(0)},${y(shown.length - 1)} V${shown.length * ROW + ROW / 2}`} stroke={laneColor(0)} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
          )}
          {shown.map((r, i) => (
            <circle
              key={r.chapter._id}
              cx={x(r.lane)}
              cy={y(i)}
              r={r.lane === 0 ? 5.5 : 4.5}
              fill={r.chapter.status === "draft" ? "var(--surface)" : laneColor(r.lane)}
              stroke={laneColor(r.lane)}
              strokeWidth={2}
            />
          ))}
        </svg>
        <ol>
          {shown.map((r) => {
            const author =
              original && r.chapter.authorId === original.ownerId ? null : authors?.[r.chapter.authorId];
            const byline = original && r.chapter.authorId === original.ownerId ? original.author : author ? `@${author}` : "";
            return (
              <li key={r.chapter._id} style={{ height: ROW, paddingLeft: graphWidth + 4 }} className="group flex items-center border-b border-border/60 pr-4 last:border-b-0">
                <Link href={`/book/${bookId}/chapter/${r.chapter._id}`} className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`truncate group-hover:text-accent ${r.lane === 0 ? "font-medium" : ""}`}>
                      {r.chapter.title || t("(başlıksız bölüm)")}
                    </span>
                    {r.branchStart && (
                      <span className="shrink-0 rounded-full px-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: laneColor(r.lane), boxShadow: `inset 0 0 0 1px ${laneColor(r.lane)}` }}>
                        {t("dal")}
                      </span>
                    )}
                    {r.chapter.status === "draft" && <span className="shrink-0 text-[11px] text-muted">{t("taslak")}</span>}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {byline ? `${byline} · ` : ""}
                    {t("{n} kelime", { n: num(r.chapter.words ?? 0) })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{ paddingLeft: graphWidth + 4 }}
            className="block w-full border-t border-border py-3 pr-4 text-left text-sm text-accent hover:bg-accent-soft/40"
          >
            {t("{n} bölüm daha · tümünü göster", { n: num(hidden) })}
          </button>
        )}
      </div>
    </div>
  );
}

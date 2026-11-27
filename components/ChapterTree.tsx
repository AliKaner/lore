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
  read,
}: {
  chapters: Chapter[];
  bookId: Id<"books">;
  // Chapters the reader has read, ticked off.
  read?: Set<string>;
  // A classic: chapters its importer holds are credited to the real author.
  original?: { ownerId: Id<"users">; author: string };
}) {
  const { t, num } = useI18n();
  const authors = useQuery(api.members.chapterAuthors, { bookId });
  const [expanded, setExpanded] = useState(false);
  // Main-line chapters whose branches are shown.
  const [openAt, setOpenAt] = useState<Set<string>>(() => new Set());
  const rows = layoutGraph(chapters);
  if (rows.length === 0) return <p className="text-sm text-muted">{t("Henüz bölüm yok.")}</p>;

  const lanes = Math.max(...rows.map((r) => r.lane)) + 1;
  const graphWidth = PAD * 2 + (lanes - 1) * LANE;
  const x = (lane: number) => PAD + lane * LANE;
  const y = (row: number) => row * ROW + ROW / 2;
  const branchCount = rows.filter((r) => r.branchStart).length;

  // One straight line and nothing branching off: a contents list reads
  // better than a graph.
  if (branchCount === 0) {
    const list = expanded || rows.length <= 14 ? rows : rows.slice(0, 12);
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <ol className="grid sm:grid-cols-2">
          {list.map((r, i) => {
            const done = read?.has(r.chapter._id);
            const minutes = Math.max(1, Math.round((r.chapter.words ?? 0) / 220));
            return (
              <li key={r.chapter._id} className="border-b border-border/60 sm:odd:border-r">
                <Link href={`/book/${bookId}/chapter/${r.chapter._id}`} className="group flex items-baseline gap-4 px-5 py-3.5 transition-colors hover:bg-accent-soft/40">
                  <span className="w-7 shrink-0 text-right font-display text-sm tabular-nums text-muted">{num(i + 1)}</span>
                  <span className={`min-w-0 flex-1 truncate group-hover:text-accent ${done ? "text-muted" : ""}`}>
                    {r.chapter.title || t("(başlıksız bölüm)")}
                  </span>
                  {r.chapter.status === "draft" && <span className="shrink-0 text-[11px] text-muted">{t("taslak")}</span>}
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {done ? <span className="text-caramel-strong">✓</span> : t("{n} dk", { n: num(minutes) })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        {list.length < rows.length && (
          <button type="button" onClick={() => setExpanded(true)} className="block w-full py-3 text-center text-sm text-accent hover:bg-accent-soft/40">
            {t("{n} bölüm daha · tümünü göster", { n: num(rows.length - list.length) })}
          </button>
        )}
      </div>
    );
  }

  // The author's own line is what shows; branches wait behind a quiet
  // "↳ 2 dal" on the chapter they leave from, and open (faint) on a click.
  const anchorOf = (index: number): number => {
    let i = index;
    while (rows[i].lane !== 0 && rows[i].parentRow !== null) i = rows[i].parentRow!;
    return i;
  };
  const branchesAt = new Map<number, number>();
  rows.forEach((r, i) => {
    if (r.branchStart) branchesAt.set(anchorOf(i), (branchesAt.get(anchorOf(i)) ?? 0) + 1);
  });
  const visibleIdx = rows
    .map((r, i) => i)
    .filter((i) => rows[i].lane === 0 || openAt.has(rows[anchorOf(i)].chapter._id));
  const mainCount = rows.filter((r) => r.lane === 0).length;
  const foldedIdx = expanded || visibleIdx.length <= COLLAPSED + 2 ? visibleIdx : visibleIdx.slice(0, COLLAPSED);
  const at = new Map(foldedIdx.map((rowIndex, display) => [rowIndex, display]));
  const hidden = visibleIdx.length - foldedIdx.length;
  const branchWord = (n: number) => (n === 1 ? t("1 dal") : t("{n} dal", { n: num(n) }));
  const toggle = (id: string) =>
    setOpenAt((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Lines: straight down a lane, or a curve out of the parent's lane.
  const paths = foldedIdx
    .filter((i) => rows[i].parentRow !== null && at.has(rows[i].parentRow!))
    .map((i) => {
      const r = rows[i];
      const parent = rows[r.parentRow!];
      const px = x(parent.lane);
      const py = y(at.get(r.parentRow!)!);
      const cx = x(r.lane);
      const cy = y(at.get(i)!);
      const d =
        parent.lane === r.lane
          ? `M${px},${py} V${cy}`
          : `M${px},${py} C${px},${py + ROW * 0.6} ${cx},${py + ROW * 0.2} ${cx},${py + ROW * 0.8} V${cy}`;
      return (
        <path key={i} d={d} fill="none" stroke={laneColor(r.lane)} strokeWidth={2} strokeLinecap="round" opacity={r.lane === 0 ? 1 : 0.55} />
      );
    });
  const openLanes = foldedIdx.some((i) => rows[i].lane > 0);
  const width = openLanes ? graphWidth : PAD * 2;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted">
        <span>
          {t("{n} bölüm", { n: num(mainCount) })}
          {branchCount > 0 && ` · ${branchWord(branchCount)}`}
        </span>
        {branchCount > 0 && (
          <button
            type="button"
            onClick={() =>
              setOpenAt((prev) =>
                prev.size > 0 ? new Set() : new Set([...branchesAt.keys()].map((i) => rows[i].chapter._id as string)),
              )
            }
            className="text-muted hover:text-foreground"
          >
            {openAt.size > 0 ? t("Dalları gizle") : t("Bütün dalları göster")}
          </button>
        )}
      </div>
      <div className="relative">
        <svg aria-hidden="true" className="absolute left-0 top-0" width={width} height={foldedIdx.length * ROW + (hidden ? ROW / 2 : 0)}>
          {paths}
          {hidden > 0 && (
            <path d={`M${x(0)},${y(foldedIdx.length - 1)} V${foldedIdx.length * ROW + ROW / 2}`} stroke={laneColor(0)} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
          )}
          {foldedIdx.map((i, display) => {
            const r = rows[i];
            return (
              <circle
                key={r.chapter._id}
                cx={x(r.lane)}
                cy={y(display)}
                r={r.lane === 0 ? 5.5 : 4}
                fill={r.chapter.status === "draft" ? "var(--surface)" : laneColor(r.lane)}
                stroke={laneColor(r.lane)}
                strokeWidth={2}
                opacity={r.lane === 0 ? 1 : 0.6}
              />
            );
          })}
        </svg>
        <ol>
          {foldedIdx.map((i) => {
            const r = rows[i];
            const isBranch = r.lane > 0;
            const author = original && r.chapter.authorId === original.ownerId ? null : authors?.[r.chapter.authorId];
            const byline = original && r.chapter.authorId === original.ownerId ? original.author : author ? `@${author}` : "";
            const count = branchesAt.get(i) ?? 0;
            const isOpen = openAt.has(r.chapter._id);
            return (
              <li
                key={r.chapter._id}
                style={{ height: isBranch ? ROW - 8 : ROW, paddingLeft: width + 4 }}
                className={`group flex items-center gap-3 border-b border-border/60 pr-4 last:border-b-0 ${isBranch ? "bg-background/40" : ""}`}
              >
                <Link href={`/book/${bookId}/chapter/${r.chapter._id}`} className={`min-w-0 flex-1 ${isBranch ? "opacity-70 hover:opacity-100" : ""}`}>
                  <span className="flex items-center gap-2">
                    <span className={`truncate group-hover:text-accent ${isBranch ? "text-sm italic" : "font-medium"}`}>
                      {r.chapter.title || t("(başlıksız bölüm)")}
                    </span>
                    {r.chapter.status === "draft" && <span className="shrink-0 text-[11px] text-muted">{t("taslak")}</span>}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {isBranch ? `${t("dal")} · ` : ""}
                    {byline ? `${byline} · ` : ""}
                    {t("{n} kelime", { n: num(r.chapter.words ?? 0) })}
                  </span>
                </Link>
                {count > 0 && (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(r.chapter._id)}
                    title={isOpen ? t("Dalları gizle") : t("Bu bölümden açılan dalları göster")}
                    className="shrink-0 rounded-full px-2.5 py-1 text-xs text-muted/80 transition-colors hover:bg-accent-soft/60 hover:text-foreground"
                  >
                    ↳ {branchWord(count)} <span aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{ paddingLeft: width + 4 }}
            className="block w-full border-t border-border py-3 pr-4 text-left text-sm text-accent hover:bg-accent-soft/40"
          >
            {t("{n} bölüm daha · tümünü göster", { n: num(hidden) })}
          </button>
        )}
      </div>
    </div>
  );
}

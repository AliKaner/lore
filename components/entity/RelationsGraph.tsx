"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useT } from "@/lib/i18n";

type Web = NonNullable<FunctionReturnType<typeof api.family.web>>;

// How each kind of link looks. Directed ones (love, hate, a mentor, a
// parent) get an arrow; the others are drawn once per pair.
const KINDS: Record<string, { label: string; color: string; dash?: string; directed: boolean }> = {
  parent: { label: "Ebeveyn", color: "var(--sapphire)", directed: true },
  spouse: { label: "Eş", color: "var(--accent)", directed: false },
  friends: { label: "Arkadaş", color: "#4f8f6a", directed: false },
  loves: { label: "Aşk", color: "#c0587a", directed: true },
  enemies: { label: "Düşman", color: "#b42318", dash: "6 4", directed: false },
  hates: { label: "Nefret", color: "#7a1f1f", dash: "2 4", directed: true },
  rivals: { label: "Rakip", color: "#c2410c", dash: "8 3 2 3", directed: false },
  mentors: { label: "Akıl hocası", color: "var(--caramel-strong)", directed: true },
};
const kindOf = (role: string) => (role === "father" || role === "mother" ? "parent" : role);

type Edge = { from: string; to: string; kind: string; mutual: boolean };
type Point = { x: number; y: number };
const pairKey = (e: Edge) => [e.from, e.to].sort().join("|");

// Pairs drawn once; a love returned becomes one line with both arrows.
function mergeEdges(web: Web): Edge[] {
  const out: Edge[] = [];
  const seen = new Map<string, Edge>();
  for (const e of web.edges) {
    const kind = kindOf(e.role);
    const spec = KINDS[kind];
    if (!spec) continue;
    const pair = [e.from, e.to].sort().join("|");
    const key = `${kind}:${pair}`;
    const existing = seen.get(key);
    if (existing) {
      if (spec.directed && existing.from !== e.from) existing.mutual = true;
      continue;
    }
    // A parent link points parent → child.
    const edge = kind === "parent" ? { from: e.to, to: e.from, kind, mutual: false } : { from: e.from, to: e.to, kind, mutual: !spec.directed };
    seen.set(key, edge);
    out.push(edge);
  }
  return out;
}

// A small force layout: everyone pushes everyone away, links pull, and
// the middle holds. Deterministic, so the picture doesn't jump.
function layout(ids: string[], edges: Edge[], width: number, height: number, root?: string): Map<string, Point> {
  const pos = new Map<string, Point>();
  const n = ids.length;
  ids.forEach((id, i) => {
    const angle = (i / Math.max(1, n)) * Math.PI * 2;
    const r = Math.min(width, height) * 0.32;
    pos.set(id, id === root ? { x: width / 2, y: height / 2 } : { x: width / 2 + Math.cos(angle) * r, y: height / 2 + Math.sin(angle) * r });
  });
  const k = Math.sqrt((width * height) / Math.max(1, n)) * 0.75;
  for (let step = 0; step < 300; step++) {
    const force = new Map(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = pos.get(ids[i])!;
        const b = pos.get(ids[j])!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const f = (k * k) / d;
        force.get(ids[i])!.x += (dx / d) * f;
        force.get(ids[i])!.y += (dy / d) * f;
        force.get(ids[j])!.x -= (dx / d) * f;
        force.get(ids[j])!.y -= (dy / d) * f;
      }
    }
    for (const e of edges) {
      const a = pos.get(e.from);
      const b = pos.get(e.to);
      if (!a || !b) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const f = (d * d) / k;
      force.get(e.from)!.x -= (dx / d) * f;
      force.get(e.from)!.y -= (dy / d) * f;
      force.get(e.to)!.x += (dx / d) * f;
      force.get(e.to)!.y += (dy / d) * f;
    }
    const temp = (1 - step / 300) * k * 0.5;
    for (const id of ids) {
      if (id === root) continue;
      const p = pos.get(id)!;
      const f = force.get(id)!;
      // Gravity towards the middle.
      f.x += (width / 2 - p.x) * 0.05;
      f.y += (height / 2 - p.y) * 0.05;
      const len = Math.max(1, Math.hypot(f.x, f.y));
      p.x = Math.min(width - 50, Math.max(50, p.x + (f.x / len) * Math.min(len, temp)));
      p.y = Math.min(height - 40, Math.max(36, p.y + (f.y / len) * Math.min(len, temp)));
    }
  }
  return pos;
}

export default function RelationsGraph({
  entityId,
  bookId,
  onOpen,
  title,
  height = 440,
  empty = null,
}: {
  entityId?: Id<"entities">;
  bookId?: Id<"books">;
  onOpen?: (id: Id<"entities">) => void;
  title?: string;
  height?: number;
  empty?: ReactNode;
}) {
  const t = useT();
  const web = useQuery(api.family.web, { ...(entityId ? { entityId } : {}), ...(bookId ? { bookId } : {}) });
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(Math.max(320, el.clientWidth)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [web]);

  const edges = useMemo(() => (web ? mergeEdges(web) : []), [web]);
  const pos = useMemo(
    () => (web ? layout(web.nodes.map((n) => n._id as string), edges, width, height, entityId) : new Map<string, Point>()),
    [web, edges, width, height, entityId],
  );

  if (web === undefined) return null;
  if (!web || web.edges.length === 0) return <>{empty}</>;
  const present = [...new Set(edges.map((e) => e.kind))];
  const shown = edges.filter((e) => !hidden.has(e.kind));
  const near = (id: string) => !hover || hover === id || shown.some((e) => (e.from === hover && e.to === id) || (e.to === hover && e.from === id));

  return (
    <section>
      {title && <h2 className="border-b border-border pb-2 font-display text-2xl">{title}</h2>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {present.map((kind) => {
          const spec = KINDS[kind];
          const off = hidden.has(kind);
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={!off}
              onClick={() =>
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(kind)) next.delete(kind);
                  else next.add(kind);
                  return next;
                })
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-opacity ${off ? "border-border opacity-40" : "border-border"}`}
            >
              <svg width="18" height="6" aria-hidden="true">
                <line x1="1" y1="3" x2="17" y2="3" stroke={spec.color} strokeWidth="2" strokeDasharray={spec.dash} />
              </svg>
              {t(spec.label)}
            </button>
          );
        })}
      </div>
      <div ref={box} className="mt-3 overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_40%,var(--surface),var(--background))]">
        <svg width={width} height={height} role="img" aria-label={title ?? t("İlişki ağı")}>
          <defs>
            {Object.entries(KINDS).map(([kind, spec]) => (
              <marker key={kind} id={`arrow-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={spec.color} />
              </marker>
            ))}
            <clipPath id="node-clip">
              <circle r="22" />
            </clipPath>
          </defs>
          {shown.map((e, i) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            const spec = KINDS[e.kind];
            // Stop the line at the edge of each circle.
            const d = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
            const ux = (b.x - a.x) / d;
            const uy = (b.y - a.y) / d;
            // Links between the same two people fan out around the straight line.
            const pair = pairKey(e);
            const siblings = shown.filter((o) => pairKey(o) === pair);
            const rank = siblings.indexOf(e);
            // Measured on one fixed direction per pair, so the fan stays put.
            const flip = e.from < e.to ? 1 : -1;
            const bow = (rank - (siblings.length - 1) / 2) * 40 * flip;
            const sx = a.x + ux * 25;
            const sy = a.y + uy * 25;
            const ex = b.x - ux * 27;
            const ey = b.y - uy * 27;
            const mx = (sx + ex) / 2 - uy * bow;
            const my = (sy + ey) / 2 + ux * bow;
            const faded = hover && e.from !== hover && e.to !== hover;
            const describe = (o: Edge) => `${t(KINDS[o.kind].label)}${o.mutual && KINDS[o.kind].directed ? ` (${t("karşılıklı")})` : ""}`;
            const label = describe(e);
            // One caption per pair, at the middle of the fan.
            const caption = rank === 0 ? siblings.map(describe).join(" · ") : null;
            const cx = siblings.length > 1 ? (sx + ex) / 2 : (sx + 2 * mx + ex) / 4;
            const cy = siblings.length > 1 ? (sy + ey) / 2 : (sy + 2 * my + ey) / 4;
            return (
              <g key={i} opacity={faded ? 0.12 : 1}>
                <path
                  d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`}
                  fill="none"
                  stroke={spec.color}
                  strokeWidth={e.kind === "loves" || e.kind === "spouse" ? 2.4 : 1.8}
                  strokeDasharray={spec.dash}
                  markerEnd={spec.directed ? `url(#arrow-${e.kind})` : undefined}
                  markerStart={spec.directed && e.mutual ? `url(#arrow-${e.kind})` : undefined}
                >
                  <title>{label}</title>
                </path>
                {hover && !faded && caption && (
                  <text
                    x={cx}
                    y={cy}
                    dy="0.35em"
                    textAnchor="middle"
                    stroke="var(--background)"
                    strokeWidth={3}
                    paintOrder="stroke"
                    className="fill-[var(--muted)] text-[10px]"
                  >
                    {caption}
                  </text>
                )}
              </g>
            );
          })}
          {web.nodes.map((node) => {
            const p = pos.get(node._id);
            if (!p) return null;
            const body = (
              <g
                transform={`translate(${p.x},${p.y})`}
                opacity={near(node._id) ? 1 : 0.25}
                onMouseEnter={() => setHover(node._id)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              >
                <circle r={node.root ? 27 : 24} fill="var(--surface)" stroke={node.root ? "var(--caramel)" : "var(--border-hover)"} strokeWidth={node.root ? 3 : 1.5} />
                {node.coverUrl ? (
                  <image href={node.coverUrl} x={-22} y={-22} width={44} height={44} clipPath="url(#node-clip)" preserveAspectRatio="xMidYMid slice" />
                ) : (
                  <text textAnchor="middle" dy="0.35em" className="fill-[var(--caramel-strong)] font-display text-lg">
                    {node.name.slice(0, 1)}
                  </text>
                )}
                <text y={node.root ? 44 : 40} textAnchor="middle" stroke="var(--background)" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke" className="fill-[var(--foreground)] text-[12px] font-medium">
                  {node.name.length > 18 ? `${node.name.slice(0, 17)}…` : node.name}
                </text>
              </g>
            );
            if (node.root) return <g key={node._id}>{body}</g>;
            if (bookId) {
              return (
                <Link key={node._id} href={`/book/${bookId}/world/${node._id}`}>
                  {body}
                </Link>
              );
            }
            if (onOpen) {
              return (
                <g key={node._id} onClick={() => onOpen(node._id)}>
                  {body}
                </g>
              );
            }
            return (
              <Link key={node._id} href={`/world/${node._id}`}>
                {body}
              </Link>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

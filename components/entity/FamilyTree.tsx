"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { eyebrow } from "@/components/entity/shared";
import { useT } from "@/lib/i18n";

type Tree = NonNullable<FunctionReturnType<typeof api.family.tree>>;
type Person = Tree["people"][number];

// Generations top to bottom; within one, children sit under their parents
// and spouses side by side.
function layout(tree: Tree): Person[][] {
  const byGen = new Map<number, Person[]>();
  for (const person of tree.people) {
    const row = byGen.get(person.gen) ?? [];
    row.push(person);
    byGen.set(person.gen, row);
  }
  const gens = [...byGen.keys()].sort((a, b) => a - b);
  const parents = new Map<string, string[]>();
  for (const { parent, child } of tree.parentOf) parents.set(child, [...(parents.get(child) ?? []), parent]);
  const spouseOf = new Map<string, string[]>();
  for (const [a, b] of tree.spouses) {
    spouseOf.set(a, [...(spouseOf.get(a) ?? []), b]);
    spouseOf.set(b, [...(spouseOf.get(b) ?? []), a]);
  }

  const position = new Map<string, number>();
  const rows: Person[][] = [];
  for (const gen of gens) {
    const row = byGen.get(gen)!;
    const key = (p: Person) => {
      const ps = (parents.get(p._id) ?? []).filter((id) => position.has(id));
      if (ps.length > 0) return ps.reduce((sum, id) => sum + position.get(id)!, 0) / ps.length;
      const partner = (spouseOf.get(p._id) ?? []).find((id) => (parents.get(id) ?? []).some((x) => position.has(x)));
      if (partner) {
        const pp = (parents.get(partner) ?? []).filter((id) => position.has(id));
        return pp.reduce((sum, id) => sum + position.get(id)!, 0) / pp.length + 0.01;
      }
      return Number.MAX_SAFE_INTEGER;
    };
    const sorted = [...row].sort((a, b) => key(a) - key(b) || Number(b.root) - Number(a.root));
    // Spouses next to each other.
    const ordered: Person[] = [];
    const placed = new Set<string>();
    for (const person of sorted) {
      if (placed.has(person._id)) continue;
      ordered.push(person);
      placed.add(person._id);
      for (const partnerId of spouseOf.get(person._id) ?? []) {
        const partner = row.find((p) => p._id === partnerId);
        if (partner && !placed.has(partner._id)) {
          ordered.push(partner);
          placed.add(partner._id);
        }
      }
    }
    ordered.forEach((p, i) => position.set(p._id, i - (ordered.length - 1) / 2));
    rows.push(ordered);
  }
  return rows;
}

type Line = { d: string; kind: "spouse" | "child" };

export default function FamilyTree({
  entityId,
  bookId,
  onOpen,
}: {
  entityId: Id<"entities">;
  bookId?: Id<"books">;
  onOpen?: (id: Id<"entities">) => void;
}) {
  const t = useT();
  const tree = useQuery(api.family.tree, bookId ? { entityId, bookId } : { entityId });
  const rows = useMemo(() => (tree ? layout(tree) : []), [tree]);
  const box = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const root = box.current;
    if (!root || !tree) return;
    const draw = () => {
      const base = root.getBoundingClientRect();
      const rect = (id: string) => {
        const el = root.querySelector<HTMLElement>(`[data-person="${id}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left - base.left, right: r.right - base.left, top: r.top - base.top, bottom: r.bottom - base.top, cx: r.left - base.left + r.width / 2, cy: r.top - base.top + r.height / 2 };
      };
      const out: Line[] = [];
      for (const [a, b] of tree.spouses) {
        const ra = rect(a);
        const rb = rect(b);
        if (!ra || !rb) continue;
        const [l, r] = ra.cx < rb.cx ? [ra, rb] : [rb, ra];
        out.push({ kind: "spouse", d: `M${l.right},${l.cy} H${r.left}` });
      }
      const parentsOf = new Map<string, string[]>();
      for (const { parent, child } of tree.parentOf) parentsOf.set(child, [...(parentsOf.get(child) ?? []), parent]);
      for (const [child, ps] of parentsOf) {
        const rc = rect(child);
        const rps = ps.map(rect).filter((r) => r !== null);
        if (!rc || rps.length === 0) continue;
        const couple = rps.length === 2 && Math.abs(rps[0].cy - rps[1].cy) < 2;
        const from = couple
          ? { x: (rps[0].cx + rps[1].cx) / 2, y: rps[0].cy }
          : { x: rps[0].cx, y: rps[0].bottom };
        const mid = rc.top - 18;
        out.push({ kind: "child", d: `M${from.x},${from.y} V${mid} H${rc.cx} V${rc.top}` });
      }
      setLines(out);
      setSize({ w: root.scrollWidth, h: root.scrollHeight });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(root);
    return () => observer.disconnect();
  }, [tree, rows]);

  if (!tree || tree.people.length < 2) return null;

  return (
    <section>
      <h2 className="border-b border-border pb-2 font-display text-2xl">{t("Soy ağacı")}</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_0%,var(--caramel-soft),transparent_70%)] p-6">
        <div ref={box} className="relative mx-auto flex w-max min-w-full flex-col items-center gap-12">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={size.w} height={size.h}>
            {lines.map((line, i) => (
              <path
                key={i}
                d={line.d}
                fill="none"
                stroke={line.kind === "spouse" ? "var(--caramel)" : "var(--border-hover)"}
                strokeWidth={line.kind === "spouse" ? 2 : 1.5}
                strokeLinejoin="round"
              />
            ))}
          </svg>
          {rows.map((row, i) => (
            <div key={i} className="relative flex items-center justify-center gap-8">
              {row.map((person) => {
                const body = (
                  <>
                    {person.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={person.coverUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-caramel-soft font-display text-xl text-caramel-strong">
                        {person.name.slice(0, 1)}
                      </span>
                    )}
                    <span className="mt-1.5 block max-w-[8rem] truncate text-sm font-medium">{person.name}</span>
                    {person.birthYear && <span className="block text-xs text-muted">{person.birthYear}</span>}
                  </>
                );
                const cls = `relative z-10 flex w-28 flex-col items-center rounded-xl border bg-surface px-2 py-2.5 text-center transition-colors ${
                  person.root ? "border-caramel shadow-[0_0_0_3px_var(--caramel-soft)]" : "border-border hover:border-border-hover"
                }`;
                if (person.root) {
                  return (
                    <div key={person._id} data-person={person._id} className={cls}>
                      {body}
                    </div>
                  );
                }
                return bookId ? (
                  <Link key={person._id} data-person={person._id} href={`/book/${bookId}/world/${person._id}`} className={`${cls} hover:text-accent`}>
                    {body}
                  </Link>
                ) : (
                  <button key={person._id} type="button" data-person={person._id} onClick={() => onOpen?.(person._id)} className={`${cls} hover:text-accent`}>
                    {body}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className={`${eyebrow} mt-2 text-muted`}>{t("Babası, annesi ve eşi alanlarından kurulur")}</p>
    </section>
  );
}

"use client";

import { useEffect, useState, type RefObject } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { markStyleOf } from "@/convex/entityKinds";
import { KindGlyph } from "@/components/entity/shared";
import { useEntityKinds } from "@/lib/localized";

// While reading, the first time a character (or a place, a sword…) comes up
// in the chapter, its card waits in the margin beside that paragraph:
// characters on the right, places and things on the left. Only where the
// margins have room.

type Placed = { id: string; top: number; side: "left" | "right" };

const CARD = 84;
const GAP = 12;

export default function MarginCards({ container, bookId }: { container: RefObject<HTMLElement | null>; bookId: Id<"books"> }) {
  const entities = useQuery(api.entities.listForBook, { bookId });
  const kinds = useEntityKinds();
  const [placed, setPlaced] = useState<Placed[]>([]);

  useEffect(() => {
    const root = container.current;
    if (!root || !entities || entities.length === 0) return;
    const kindOf = new Map(entities.map((e) => [e._id as string, e.kind]));
    let frame = 0;
    const measure = () => {
      frame = 0;
      const base = root.getBoundingClientRect().top;
      const seen = new Set<string>();
      const firsts: Placed[] = [];
      for (const mark of root.querySelectorAll<HTMLElement>("[data-entity-id]")) {
        const id = mark.dataset.entityId!;
        if (seen.has(id) || !kindOf.has(id)) continue;
        seen.add(id);
        const side = markStyleOf(kindOf.get(id)!) === "character" ? "right" : "left";
        firsts.push({ id, top: mark.getBoundingClientRect().top - base - 8, side });
      }
      // Cards on one side never overlap: each starts below the last.
      const bottoms = { left: -Infinity, right: -Infinity };
      const out = firsts
        .sort((a, b) => a.top - b.top)
        .map((p) => {
          const top = Math.max(p.top, bottoms[p.side] + GAP);
          bottoms[p.side] = top + CARD;
          return { ...p, top };
        });
      setPlaced((prev) =>
        prev.length === out.length && prev.every((p, i) => p.id === out[i].id && Math.abs(p.top - out[i].top) < 1) ? prev : out,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    const mutations = new MutationObserver(schedule);
    mutations.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-entity-id"] });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [container, entities]);

  if (!entities || placed.length === 0) return null;
  const byId = new Map(entities.map((e) => [e._id as string, e]));

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden xl:block">
      {placed.map((p) => {
        const entity = byId.get(p.id);
        if (!entity) return null;
        return (
          <Link
            key={p.id}
            href={`/book/${bookId}/world/${p.id}`}
            tabIndex={-1}
            style={{ top: p.top, height: CARD }}
            className={`margin-card pointer-events-auto absolute flex w-56 items-center gap-3 rounded-xl border border-border bg-surface/90 p-2.5 shadow-[0_14px_30px_-20px_rgba(15,25,57,0.5)] backdrop-blur transition-colors hover:border-accent ${
              p.side === "right" ? "left-full ml-12" : "right-full mr-12 flex-row-reverse text-right"
            }`}
          >
            {entity.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entity.coverUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-background">
                <KindGlyph kind={entity.kind} size="lg" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-caramel-strong">{kinds[entity.kind].label}</span>
              <span className="block truncate font-display text-lg leading-tight">{entity.name}</span>
              {entity.summary && <span className="line-clamp-2 block text-xs leading-snug text-muted">{entity.summary}</span>}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

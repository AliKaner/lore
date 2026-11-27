"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useI18n } from "@/lib/i18n";

// The timeline events an entity takes part in, on its own page.
export default function EntityEvents({ entityId }: { entityId: Id<"entities"> }) {
  const events = useQuery(api.events.list, { entityId });
  const { t, num } = useI18n();
  if (!events || events.length === 0) return null;
  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="font-display text-2xl">{t("Zaman çizelgesinde")}</h2>
        <Link href="/world/timeline" className="text-sm text-muted hover:text-accent">
          {t("Zaman çizelgesine git →")}
        </Link>
      </div>
      <ol className="mt-2">
        {events.map((event) => (
          <li key={event._id} className="grid grid-cols-[4.5rem_1fr] gap-x-4 border-b border-border/70 py-2 last:border-b-0">
            <span className="text-right font-display tabular-nums text-muted">{event.year === null ? "—" : num(event.year)}</span>
            <span className="min-w-0">
              <span className="block truncate">{event.title}</span>
              {event.dateLabel && <span className="block text-xs text-muted">{event.dateLabel}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Cloth-and-foil palettes for covers drawn from the title alone.
const PALETTES = [
  { bg: "#0f1939", ink: "#f6f3e7", rule: "#e3af64" },
  { bg: "#26428b", ink: "#f6f3e7", rule: "#faebd7" },
  { bg: "#e3af64", ink: "#0f1939", rule: "#0f1939" },
  { bg: "#5b2333", ink: "#faebd7", rule: "#e3af64" },
  { bg: "#2f4a3a", ink: "#f1ead8", rule: "#d9c38f" },
  { bg: "#f6f3e7", ink: "#0f1939", rule: "#516ac8" },
];

function paletteFor(title: string) {
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

// A book's cover: its picture, or a cover drawn from its title (and author)
// so no book is ever a blank box. `overlay` lays title and author over a
// picture, as a publisher's series would.
export default function BookCover({
  storageId,
  title,
  author,
  className,
  placeholder,
  overlay = false,
}: {
  storageId?: Id<"_storage">;
  title: string;
  author?: string;
  className?: string;
  // Kept for older callers; the drawn cover replaces the old text box.
  placeholder?: string;
  overlay?: boolean;
}) {
  const url = useQuery(api.files.getUrl, storageId ? { storageId } : "skip");
  const byline = author ?? (placeholder && placeholder !== title ? placeholder : undefined);

  if (url) {
    return (
      <div className={`@container relative overflow-hidden bg-ink ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={title} className="absolute inset-0 h-full w-full object-cover object-top" />
        {overlay && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b1230]/95 via-[#0b1230]/75 to-transparent px-[8cqw] pb-[8cqw] pt-[22cqw] text-[#f6f3e7]">
            <p className="font-display text-[12cqw] leading-[1.02]">{title}</p>
            {byline && <p className="mt-[3cqw] text-[6.5cqw] uppercase tracking-[0.14em] text-[#e3af64]">{byline}</p>}
          </div>
        )}
      </div>
    );
  }

  const colors = paletteFor(title);
  return (
    <div
      role="img"
      aria-label={title}
      style={{ background: colors.bg, color: colors.ink }}
      className={`@container relative flex flex-col overflow-hidden ${className ?? ""}`}
    >
      {/* Cloth texture and a spine shadow. */}
      <span aria-hidden="true" className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_5px)]" />
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[6%] bg-black/15" />
      <div className="relative flex flex-1 flex-col items-center justify-center px-[10cqw] text-center">
        <span aria-hidden="true" className="mb-[6cqw] h-px w-[30cqw]" style={{ background: colors.rule }} />
        <p className="font-display text-[13cqw] leading-[1.05] [overflow-wrap:anywhere]">{title}</p>
        <span aria-hidden="true" className="mt-[6cqw] h-px w-[30cqw]" style={{ background: colors.rule }} />
        {byline && <p className="mt-[5cqw] text-[6cqw] uppercase tracking-[0.16em] opacity-85">{byline}</p>}
      </div>
    </div>
  );
}

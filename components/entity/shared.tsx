"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ENTITY_KINDS, markStyleOf, type EntityKind } from "@/convex/entityKinds";

export type Chip = { _id: Id<"entities">; kind: EntityKind; name: string };

export const eyebrow = "text-[10px] font-semibold uppercase tracking-[0.18em]";

// A kind's glyph in a small tinted diamond: caramel for people, sapphire for
// places, ink for everything else.
export function KindGlyph({ kind, size = "sm" }: { kind: EntityKind; size?: "sm" | "lg" }) {
  const tone = {
    character: "bg-caramel-soft text-caramel-strong",
    place: "bg-sapphire-soft text-sapphire",
    thing: "bg-accent-soft text-accent",
  }[markStyleOf(kind)];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${tone} ${
        size === "lg" ? "h-16 w-16 text-3xl" : "h-5 w-5 text-[11px]"
      }`}
    >
      {ENTITY_KINDS[kind].glyph}
    </span>
  );
}

export function EntityChip({
  chip,
  onOpen,
  href,
  onRemove,
}: {
  chip: Chip;
  onOpen?: () => void;
  href?: string;
  onRemove?: () => void;
}) {
  const body = (
    <>
      <KindGlyph kind={chip.kind} />
      <span className="truncate">{chip.name}</span>
    </>
  );
  const bodyClass =
    "inline-flex min-w-0 items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-sm transition-colors";
  return (
    <span className="group inline-flex max-w-full items-center rounded-full border border-border bg-surface hover:border-border-hover">
      {href ? (
        <a href={href} className={`${bodyClass} hover:text-accent`}>
          {body}
        </a>
      ) : onOpen ? (
        <button type="button" onClick={onOpen} className={`${bodyClass} hover:text-accent`}>
          {body}
        </button>
      ) : (
        <span className={bodyClass}>{body}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${chip.name} bağlantısını kaldır`}
          className="-ml-1 mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-muted hover:bg-accent-soft hover:text-foreground"
        >
          ✕
        </button>
      )}
    </span>
  );
}

const MAX_BYTES = 10 * 1024 * 1024;

// Uploads one picture to Convex storage and returns its id.
export function useImageUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  return async (file: File): Promise<Id<"_storage">> => {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name} bir görsel değil.`);
    if (file.size > MAX_BYTES) throw new Error(`${file.name} 10 MB'tan büyük.`);
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!result.ok) throw new Error("Görsel yüklenemedi, tekrar dener misin?");
    const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
    return storageId;
  };
}

export function errorText(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  const match = /Uncaught Error: ([^\n]+)/u.exec(message);
  if (match) return match[1];
  return message && !message.includes("[CONVEX") ? message : "Kaydedilemedi. Bağlantını kontrol edip tekrar dene.";
}

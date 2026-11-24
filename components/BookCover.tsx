"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function BookCover({
  storageId,
  title,
  className,
  placeholder,
}: {
  storageId?: Id<"_storage">;
  title: string;
  className?: string;
  placeholder?: string;
}) {
  const url = useQuery(api.files.getUrl, storageId ? { storageId } : "skip");

  if (!url) {
    if (!placeholder) return null;
    return (
      <div
        className={`flex items-center justify-center bg-surface text-muted text-xs ${className ?? ""}`}
      >
        {placeholder}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={title} className={`object-cover ${className ?? ""}`} />;
}

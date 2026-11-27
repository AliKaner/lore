"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// A picture from Convex storage (a profile photo, a wallpaper), or the
// fallback when there is none.
export default function StoredImage({
  storageId,
  alt,
  className,
  fallback = null,
}: {
  storageId?: Id<"_storage">;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const url = useQuery(api.files.getUrl, storageId ? { storageId } : "skip");
  if (!url) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={`object-cover ${className ?? ""}`} />;
}

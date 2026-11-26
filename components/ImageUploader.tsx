"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useT } from "@/lib/i18n";

const MAX_BYTES = 10 * 1024 * 1024;

// A picture field: the current picture (or an empty frame) and a button to
// choose a new one. The browser's own file input stays hidden.
export default function ImageUploader({
  label,
  storageId,
  onUploaded,
}: {
  label: string;
  storageId?: Id<"_storage">;
  onUploaded: (storageId: Id<"_storage">) => void;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const url = useQuery(api.files.getUrl, storageId ? { storageId } : "skip");
  const showToast = useToast();
  const [uploading, setUploading] = useState(false);
  const t = useT();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast(t("Bir görsel dosyası seç."));
    if (file.size > MAX_BYTES) return showToast(t("Görsel 10 MB'tan büyük olamaz."));
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error(t("Görsel yüklenemedi, tekrar dener misin?"));
      const { storageId: newStorageId } = await result.json();
      onUploaded(newStorageId);
    } catch (err) {
      showToast(toastErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-14 w-14 rounded-lg border border-border object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border-hover text-muted"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <rect x="3" y="4" width="14" height="12" rx="2" />
            <path d="M3.5 13.5l4-4 3 3 2-2 4 4" />
            <circle cx="13" cy="8" r="1.3" />
          </svg>
        </span>
      )}
      <div className="text-sm">
        <p className="text-muted">{label}</p>
        <label
          className={`mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-border-hover hover:bg-accent-soft/40 ${
            uploading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {uploading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-accent" />}
          {uploading ? t("Yükleniyor…") : url ? t("Değiştir") : t("Görsel seç")}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void handleFileChange(event)}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}

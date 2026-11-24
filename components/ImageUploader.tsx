"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toastErrorMessage, useToast } from "@/components/Toaster";

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
  const url = useQuery(
    api.files.getUrl,
    storageId ? { storageId } : "skip",
  );
  const showToast = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) {
        throw new Error("Görsel yüklenemedi, tekrar dener misin?");
      }
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
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-16 w-16 object-cover rounded" />
      )}
      <label className="text-sm">
        <span className="block text-muted mb-1">
          {label}
          {uploading && " — yükleniyor…"}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => void handleFileChange(event)}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

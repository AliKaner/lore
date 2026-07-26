"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

interface ImageUploadProps {
  sessionToken?: string;
  writerToken?: string;
  currentImageUrl?: string | null;
  onUpload: (storageId: string) => void;
  label?: string;
}

export function ImageUpload({
  sessionToken,
  writerToken,
  currentImageUrl,
  onUpload,
  label = "Image",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ sessionToken, writerToken });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await response.json();
      onUpload(storageId);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview || currentImageUrl;

  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-300">{label}</label>
      {displayUrl && (
        <div className="relative w-32 h-32 rounded overflow-hidden border border-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 cursor-pointer"
      />
      {uploading && (
        <p className="text-xs text-blue-400">Uploading...</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ChapterEditor } from "@/components/Editor";
import { buttonPrimary, buttonSecondary, inputBase } from "@/lib/ui";

export default function ChapterForm({
  bookId,
  parentChapterId,
  existingChapter,
}: {
  bookId: Id<"books">;
  parentChapterId?: Id<"chapters">;
  existingChapter?: Doc<"chapters">;
}) {
  const createChapter = useMutation(api.chapters.create);
  const updateChapter = useMutation(api.chapters.update);
  const router = useRouter();
  const [title, setTitle] = useState(existingChapter?.title ?? "");
  const [content, setContent] = useState(existingChapter?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<
    "draft" | "published" | null
  >(null);

  async function handleSubmit(status: "draft" | "published") {
    setError(null);
    setPendingStatus(status);
    try {
      if (existingChapter) {
        await updateChapter({
          chapterId: existingChapter._id,
          title: title.trim(),
          content,
          status,
        });
        router.push(`/kitap/${bookId}/bolum/${existingChapter._id}`);
        return;
      }
      const chapterId = await createChapter({
        bookId,
        parentChapterId,
        title: title.trim(),
        content,
        status,
      });
      router.push(`/kitap/${bookId}/bolum/${chapterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir şeyler ters gitti.");
      setPendingStatus(null);
    }
  }

  const disabled = title.trim().length === 0 || pendingStatus !== null;

  return (
    <div className="flex flex-col gap-4">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Bölüm başlığı"
        className={`${inputBase} text-lg`}
      />
      <ChapterEditor content={content} onChange={setContent} />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => void handleSubmit("published")}
          disabled={disabled}
          className={buttonPrimary}
        >
          {pendingStatus === "published" ? "Yayınlanıyor…" : "Yayınla"}
        </button>
        <button
          onClick={() => void handleSubmit("draft")}
          disabled={disabled}
          className={buttonSecondary}
        >
          {pendingStatus === "draft" ? "Kaydediliyor…" : "Taslak olarak kaydet"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

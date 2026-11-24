"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { pillInactive } from "@/lib/ui";
import { kindConfig } from "@/lib/writingKinds";

export default function BookTitleEditor({ book }: { book: Doc<"books"> }) {
  const untitled = kindConfig(book).untitled;
  const updateBook = useMutation(api.books.update);
  const showToast = useToast();
  const [title, setTitle] = useState(book.title);
  const [description, setDescription] = useState(book.description ?? "");

  async function saveTitle() {
    const trimmed = title.trim() || untitled;
    setTitle(trimmed);
    if (trimmed === book.title) return;
    try {
      await updateBook({ bookId: book._id, title: trimmed });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  async function saveDescription() {
    if (description === (book.description ?? "")) return;
    try {
      await updateBook({ bookId: book._id, description: description || undefined });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  async function toggleVisibility() {
    const next = book.visibility === "public" ? "private" : "public";
    try {
      await updateBook({ bookId: book._id, visibility: next });
      showToast(
        next === "public" ? "Herkese açıldı." : "Gizli yapıldı.",
        "success",
      );
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-2 mb-6">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => void saveTitle()}
        placeholder={untitled}
        className="title-input w-full border-none bg-transparent p-0 text-2xl font-semibold focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        onBlur={() => void saveDescription()}
        placeholder="Kısa bir açıklama ekle (opsiyonel)…"
        rows={2}
        className="w-full resize-none border-none bg-transparent p-0 text-sm text-muted focus:outline-none"
      />
      <button onClick={() => void toggleVisibility()} className={`${pillInactive} self-start`}>
        {book.visibility === "public" ? "Herkese açık" : "Gizli — herkese aç"}
      </button>
    </div>
  );
}

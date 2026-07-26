"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ContentEditor } from "./ContentEditor";

type StudioAuth =
  | { kind: "admin"; sessionToken: string }
  | { kind: "writer"; writerToken: string };

interface ChapterStudioProps {
  bookId: Id<"books">;
  auth: StudioAuth;
  exitHref: string;
}

interface SessionChapter {
  _id: string;
  title: string;
  order: number;
}

export function ChapterStudio({ bookId, auth, exitHref }: ChapterStudioProps) {
  const book = useQuery(api.books.getById, { id: bookId });
  const existingChapters = useQuery(api.chapters.listByBook, { bookId });
  const universeEntries = useQuery(
    api.loreEntries.listByUniverse,
    book ? { universeId: book.universeId } : "skip"
  );

  const notesArgs =
    auth.kind === "admin"
      ? { bookId, sessionToken: auth.sessionToken }
      : { bookId, writerToken: auth.writerToken };
  const savedNotes = useQuery(api.bookNotes.get, notesArgs);
  const saveNotes = useMutation(api.bookNotes.save);

  const createChapterAdmin = useMutation(api.chapters.create);
  const createChapterWriter = useMutation(api.writerContent.createChapter);

  const [title, setTitle] = useState("");
  const [contentTr, setContentTr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentLang, setContentLang] = useState<"tr" | "en">("tr");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [sessionChapters, setSessionChapters] = useState<SessionChapter[]>([]);

  const [notes, setNotes] = useState("");
  const notesLoaded = useRef(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notesLoaded.current && savedNotes !== undefined) {
      setNotes(savedNotes);
      notesLoaded.current = true;
    }
  }, [savedNotes]);

  const persistNotes = (value: string) => {
    saveNotes({ ...notesArgs, content: value }).catch(() => {});
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => persistNotes(value), 1500);
  };

  const handleNotesBlur = () => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    persistNotes(notes);
  };

  const characters = (universeEntries ?? []).filter((e) => e.type === "character");

  const allPreviousChapters: SessionChapter[] = [
    ...(existingChapters ?? []).map((c) => ({ _id: c._id, title: c.title, order: c.order })),
    ...sessionChapters.filter(
      (sc) => !(existingChapters ?? []).some((c) => c._id === sc._id)
    ),
  ].sort((a, b) => a.order - b.order);

  const nextOrder =
    allPreviousChapters.length > 0
      ? Math.max(...allPreviousChapters.map((c) => c.order)) + 1
      : 0;

  const handleSaveAndContinue = async () => {
    if (!title.trim()) {
      setError("Başlık gerekli.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let newId: string;
      if (auth.kind === "admin") {
        newId = await createChapterAdmin({
          bookId,
          title,
          contentTr,
          contentEn,
          order: nextOrder,
          sessionToken: auth.sessionToken,
        });
      } else {
        newId = await createChapterWriter({
          writerToken: auth.writerToken,
          bookId,
          title,
          contentTr,
          contentEn,
        });
      }

      setSessionChapters((prev) => [...prev, { _id: newId, title, order: nextOrder }]);
      window.localStorage.removeItem(`draft_studio_${bookId}_tr`);
      window.localStorage.removeItem(`draft_studio_${bookId}_en`);
      setTitle("");
      setContentTr("");
      setContentEn("");
      setSavedMessage(`"${title}" kaydedildi — yeni bölüme geçebilirsin.`);
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (book === undefined) {
    return (
      <div className="fixed inset-0 z-40 bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="fixed inset-0 z-40 bg-gray-950 flex flex-col items-center justify-center gap-4 text-white">
        <p className="font-title text-2xl">Kitap bulunamadı.</p>
        <Link href={exitHref} className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg font-text">
          Geri Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 bg-black/40 flex-shrink-0">
        <div className="min-w-0">
          <p className="font-title font-bold truncate">{book.title}</p>
          <p className="text-xs text-gray-500 font-text truncate">
            {book.universe?.name} · Sıradaki bölüm: #{nextOrder + 1}
          </p>
        </div>
        <Link
          href={exitHref}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm font-text hover:bg-white/20 transition-colors flex-shrink-0"
        >
          Çık
        </Link>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[220px_1fr_260px]">
        {/* Left: Characters */}
        <div className="hidden lg:flex flex-col border-r border-white/10 overflow-y-auto p-4">
          <h2 className="text-sm font-bold text-gray-300 font-title uppercase mb-3">
            Karakterler
          </h2>
          {characters.length === 0 ? (
            <p className="text-xs text-gray-600 font-text">Bu evrende karakter yok.</p>
          ) : (
            <div className="space-y-1">
              {characters.map((c) => (
                <a
                  key={c._id}
                  href={`/lore/${c._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-2 py-1.5 rounded text-sm font-text text-gray-300 hover:bg-white/10 hover:text-white transition-colors truncate"
                >
                  👤 {c.name}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Center: Editor */}
        <div className="overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bölüm başlığı..."
              className="w-full bg-transparent border-b border-white/20 px-1 py-2 text-2xl font-title text-white placeholder-gray-600 focus:outline-none focus:border-white/50"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContentLang("tr")}
                className={`px-4 py-1 rounded text-sm font-text transition-colors ${contentLang === "tr" ? "bg-white/30 text-white" : "bg-white/10 text-gray-400"}`}
              >
                Türkçe
              </button>
              <button
                type="button"
                onClick={() => setContentLang("en")}
                className={`px-4 py-1 rounded text-sm font-text transition-colors ${contentLang === "en" ? "bg-white/30 text-white" : "bg-white/10 text-gray-400"}`}
              >
                English
              </button>
            </div>

            {contentLang === "tr" ? (
              <ContentEditor
                value={contentTr}
                onChange={setContentTr}
                rows={22}
                placeholder="Türkçe içerik..."
                storageKey={`draft_studio_${bookId}_tr`}
              />
            ) : (
              <ContentEditor
                value={contentEn}
                onChange={setContentEn}
                rows={22}
                placeholder="English content..."
                storageKey={`draft_studio_${bookId}_en`}
              />
            )}

            {error && <p className="text-red-400 text-sm font-text">{error}</p>}
            {savedMessage && (
              <p className="text-green-400 text-sm font-text">✅ {savedMessage}</p>
            )}

            <button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="w-full px-6 py-3 bg-white/20 border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-colors disabled:opacity-50 font-text"
            >
              {saving ? "Kaydediliyor..." : "Bölümü Kaydet ve Yeni Bölüme Geç →"}
            </button>
          </div>
        </div>

        {/* Right: Previous chapters + notes */}
        <div className="hidden lg:flex flex-col border-l border-white/10 overflow-y-auto p-4 gap-6">
          <div>
            <h2 className="text-sm font-bold text-gray-300 font-title uppercase mb-3">
              Önceki Bölümler
            </h2>
            {allPreviousChapters.length === 0 ? (
              <p className="text-xs text-gray-600 font-text">Henüz bölüm yok.</p>
            ) : (
              <div className="space-y-1">
                {allPreviousChapters.map((c) => (
                  <a
                    key={c._id}
                    href={`/book/${bookId}/${c._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-2 py-1.5 rounded text-sm font-text text-gray-300 hover:bg-white/10 hover:text-white transition-colors truncate"
                  >
                    #{c.order + 1} {c.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <h2 className="text-sm font-bold text-gray-300 font-title uppercase mb-3">
              Notlarım
            </h2>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Kendine notlar bırak..."
              className="flex-1 min-h-[160px] w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/30 resize-none font-text"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

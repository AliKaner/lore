"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useWriterAuth } from "@/hooks/useWriterAuth";
import { ContentEditor } from "@/components/ContentEditor";

export default function WriteNewChapter() {
  const { token } = useWriterAuth();
  const universes = useQuery(api.universes.list);
  const books = useQuery(api.books.list);
  const createChapter = useMutation(api.writerContent.createChapter);

  const [universeId, setUniverseId] = useState("");
  const [bookId, setBookId] = useState("");
  const [title, setTitle] = useState("");
  const [contentTr, setContentTr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentLang, setContentLang] = useState<"tr" | "en">("tr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredBooks = books?.filter(
    (b) => !universeId || b.universeId === universeId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !bookId || !title) return;
    setLoading(true);
    setError("");
    try {
      await createChapter({
        writerToken: token,
        bookId: bookId as Id<"books">,
        title,
        contentTr,
        contentEn,
      });
      window.localStorage.removeItem("draft_write_chapter_tr");
      window.localStorage.removeItem("draft_write_chapter_en");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white/10 border border-white/20 rounded-xl p-8 text-center">
        <p className="text-4xl mb-4">✅</p>
        <h1 className="text-2xl font-bold text-white font-title mb-2">Gönderildi!</h1>
        <p className="text-gray-400 font-text mb-6">
          "{title}" admin onayı bekliyor. Onaylandığında sitede yayınlanacak.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/write" className="px-5 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text">
            Panelime Dön
          </Link>
          <button
            onClick={() => {
              setSuccess(false);
              setTitle("");
              setContentTr("");
              setContentEn("");
            }}
            className="px-5 py-2 bg-transparent border border-white/20 rounded-lg text-gray-400 hover:text-white transition-colors font-text"
          >
            Yeni Bir Tane Daha Ekle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white font-title mb-6">Yeni Bölüm</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white/10 border border-white/20 rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-text">Evren (filtre)</label>
            <select
              value={universeId}
              onChange={(e) => { setUniverseId(e.target.value); setBookId(""); }}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
            >
              <option value="">Tüm Evrenler</option>
              {universes?.map((u) => (
                <option key={u._id} value={u._id} className="bg-gray-900">{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-text">Kitap *</label>
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
            >
              <option value="">Kitap seçin</option>
              {filteredBooks?.map((b) => (
                <option key={b._id} value={b._id} className="bg-gray-900">{b.title}</option>
              ))}
            </select>
          </div>
        </div>

        {bookId && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-300 font-text">
              📝 Sürekli yazma deneyimi için stüdyoyu deneyebilirsin — tam ekran, yan tarafta karakterler ve önceki bölümler.
            </p>
            <Link
              href={`/write/books/${bookId}/write`}
              className="px-4 py-1.5 bg-green-600/40 border border-green-500/40 rounded-lg text-white text-sm font-text hover:bg-green-600/60 transition-colors flex-shrink-0"
            >
              Stüdyoyu Aç
            </Link>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1 font-text">Başlık *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
          />
        </div>

        <div>
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setContentLang("tr")} className={`px-4 py-1 rounded text-sm font-text transition-colors ${contentLang === "tr" ? "bg-white/30 text-white" : "bg-white/10 text-gray-400"}`}>Türkçe</button>
            <button type="button" onClick={() => setContentLang("en")} className={`px-4 py-1 rounded text-sm font-text transition-colors ${contentLang === "en" ? "bg-white/30 text-white" : "bg-white/10 text-gray-400"}`}>English</button>
          </div>
          {contentLang === "tr" ? (
            <ContentEditor
              value={contentTr}
              onChange={setContentTr}
              rows={20}
              placeholder="Türkçe içerik..."
              storageKey="draft_write_chapter_tr"
            />
          ) : (
            <ContentEditor
              value={contentEn}
              onChange={setContentEn}
              rows={20}
              placeholder="English content..."
              storageKey="draft_write_chapter_en"
            />
          )}
        </div>

        {error && <p className="text-red-400 text-sm font-text">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors disabled:opacity-50 font-text"
        >
          {loading ? "Gönderiliyor..." : "Onaya Gönder"}
        </button>
      </form>
    </div>
  );
}

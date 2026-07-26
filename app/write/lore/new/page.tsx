"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useWriterAuth } from "@/hooks/useWriterAuth";
import { ImageUpload } from "@/components/ImageUpload";
import { ContentEditor } from "@/components/ContentEditor";

const TYPES = ["character", "city", "item", "story", "other"] as const;
type LoreType = (typeof TYPES)[number];

export default function WriteNewLoreEntry() {
  const { token } = useWriterAuth();
  const universes = useQuery(api.universes.list);
  const categories = useQuery(api.categories.list);
  const createEntry = useMutation(api.writerContent.createLoreEntry);

  const [universeId, setUniverseId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<LoreType>("character");
  const [contentTr, setContentTr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentLang, setContentLang] = useState<"tr" | "en">("tr");
  const [imageStorageId, setImageStorageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredCategories = categories?.filter(
    (c) => !universeId || c.universeId === universeId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !universeId || !categoryId || !name) return;
    setLoading(true);
    setError("");
    try {
      await createEntry({
        writerToken: token,
        universeId: universeId as Id<"universes">,
        categoryId: categoryId as Id<"categories">,
        name,
        type,
        contentTr,
        contentEn,
        imageStorageId: imageStorageId ? (imageStorageId as Id<"_storage">) : undefined,
      });
      window.localStorage.removeItem("draft_write_lore_tr");
      window.localStorage.removeItem("draft_write_lore_en");
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
          "{name}" admin onayı bekliyor. Onaylandığında sitede yayınlanacak.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/write" className="px-5 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text">
            Panelime Dön
          </Link>
          <button
            onClick={() => {
              setSuccess(false);
              setName("");
              setContentTr("");
              setContentEn("");
              setImageStorageId("");
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
      <h1 className="text-3xl font-bold text-white font-title mb-6">Yeni Lore Girdisi</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white/10 border border-white/20 rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-text">Evren *</label>
            <select
              value={universeId}
              onChange={(e) => { setUniverseId(e.target.value); setCategoryId(""); }}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
            >
              <option value="">Evren seçin</option>
              {universes?.map((u) => (
                <option key={u._id} value={u._id} className="bg-gray-900">{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-text">Kategori *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
            >
              <option value="">Kategori seçin</option>
              {filteredCategories?.map((c) => (
                <option key={c._id} value={c._id} className="bg-gray-900">{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-text">İsim *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1 font-text">Tür *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LoreType)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="bg-gray-900 capitalize">{t}</option>
              ))}
            </select>
          </div>
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
              rows={12}
              placeholder="Türkçe içerik..."
              storageKey="draft_write_lore_tr"
            />
          ) : (
            <ContentEditor
              value={contentEn}
              onChange={setContentEn}
              rows={12}
              placeholder="English content..."
              storageKey="draft_write_lore_en"
            />
          )}
        </div>

        {token && (
          <ImageUpload
            writerToken={token}
            currentImageUrl={undefined}
            onUpload={setImageStorageId}
            label="Görsel (opsiyonel)"
          />
        )}

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

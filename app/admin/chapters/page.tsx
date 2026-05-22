"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { CleanTextarea } from "@/components/CleanTextarea";

type Mode = "list" | "create" | "edit";

interface FormData {
  bookId: string;
  title: string;
  contentTr: string;
  contentEn: string;
  order: string;
}

const EMPTY: FormData = { bookId: "", title: "", contentTr: "", contentEn: "", order: "1" };

const getWordCount = (text: string) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
};

export default function AdminChapters() {
  const { token } = useAdminAuth();
  const universes = useQuery(api.universes.list);
  const books = useQuery(api.books.list);
  const chapters = useQuery(api.chapters.list);
  const createMutation = useMutation(api.chapters.create);
  const updateMutation = useMutation(api.chapters.update);
  const removeMutation = useMutation(api.chapters.remove);

  const [mode, setMode] = useState<Mode>("list");
  const [editId, setEditId] = useState<Id<"chapters"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [filterUniverse, setFilterUniverse] = useState("all");
  const [filterBook, setFilterBook] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contentLang, setContentLang] = useState<"tr" | "en">("tr");

  const filteredBooks = books?.filter(
    (b) => filterUniverse === "all" || b.universeId === filterUniverse
  );
  const formBooks = books?.filter(
    (b) => !filterUniverse || filterUniverse === "all" || b.universeId === filterUniverse
  );

  const openCreate = () => { setForm(EMPTY); setEditId(null); setMode("create"); setError(""); };
  const openEdit = (c: any) => {
    setForm({
      bookId: c.bookId,
      title: c.title,
      contentTr: c.contentTr,
      contentEn: c.contentEn,
      order: c.order.toString(),
    });
    setEditId(c._id);
    setMode("edit");
    setError("");
  };
  const cancel = () => { setMode("list"); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.bookId) return;
    setLoading(true);
    setError("");
    try {
      const data = {
        bookId: form.bookId as Id<"books">,
        title: form.title,
        contentTr: form.contentTr,
        contentEn: form.contentEn,
        order: parseInt(form.order) || 1,
        sessionToken: token,
      };
      if (mode === "create") {
        await createMutation(data);
      } else if (editId) {
        await updateMutation({ id: editId, ...data });
      }
      setMode("list");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: Id<"chapters">) => {
    if (!token || !confirm("Delete this chapter?")) return;
    try {
      await removeMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = chapters?.filter((c) => {
    if (filterBook !== "all") return c.bookId === filterBook;
    if (filterUniverse !== "all") {
      const book = books?.find((b) => b._id === c.bookId);
      return book?.universeId === filterUniverse;
    }
    return true;
  });

  const getBookName = (id: string) => books?.find((b) => b._id === id)?.title ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-title">Chapters</h1>
        {mode === "list" && (
          <button onClick={openCreate} className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text">
            + Add Chapter
          </button>
        )}
      </div>

      {/* Form */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 font-title">
            {mode === "create" ? "New Chapter" : "Edit Chapter"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-text">Universe (filter)</label>
                <select
                  value={filterUniverse}
                  onChange={(e) => setFilterUniverse(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
                >
                  <option value="all" className="bg-gray-900">All Universes</option>
                  {universes?.map((u) => <option key={u._id} value={u._id} className="bg-gray-900">{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-text">Book *</label>
                <select
                  value={form.bookId}
                  onChange={(e) => setForm({ ...form, bookId: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
                >
                  <option value="">Select book</option>
                  {formBooks?.map((b) => <option key={b._id} value={b._id} className="bg-gray-900">{b.title}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-text">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-text">Chapter Order *</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  required
                  min={1}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
                />
              </div>
            </div>
            {/* Content with language tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setContentLang("tr")} className={`px-4 py-1 rounded text-sm font-text transition-colors ${contentLang === "tr" ? "bg-white/30 text-white" : "bg-white/10 text-gray-400"}`}>Türkçe</button>
                  <button type="button" onClick={() => setContentLang("en")} className={`px-4 py-1 rounded text-sm font-text transition-colors ${contentLang === "en" ? "bg-white/30 text-white" : "bg-white/10 text-gray-400"}`}>English</button>
                </div>
                <div className="text-sm text-gray-400 font-text">
                  {contentLang === "tr" ? `${getWordCount(form.contentTr)} kelime` : `${getWordCount(form.contentEn)} words`}
                </div>
              </div>
              {contentLang === "tr" ? (
                <CleanTextarea
                  value={form.contentTr}
                  onChange={(v) => setForm({ ...form, contentTr: v })}
                  rows={12}
                  placeholder="Türkçe içerik..."
                />
              ) : (
                <CleanTextarea
                  value={form.contentEn}
                  onChange={(v) => setForm({ ...form, contentEn: v })}
                  rows={12}
                  placeholder="English content..."
                />
              )}
            </div>
            {error && <p className="text-red-400 text-sm font-text">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors disabled:opacity-50 font-text">
                {loading ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={cancel} className="px-6 py-2 bg-transparent border border-white/20 rounded-lg text-gray-400 hover:text-white transition-colors font-text">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      {mode === "list" && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={filterUniverse} onChange={(e) => { setFilterUniverse(e.target.value); setFilterBook("all"); }} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            <option value="all" className="bg-gray-900">All Universes</option>
            {universes?.map((u) => <option key={u._id} value={u._id} className="bg-gray-900">{u.name}</option>)}
          </select>
          <select value={filterBook} onChange={(e) => setFilterBook(e.target.value)} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            <option value="all" className="bg-gray-900">All Books</option>
            {filteredBooks?.map((b) => <option key={b._id} value={b._id} className="bg-gray-900">{b.title}</option>)}
          </select>
        </div>
      )}

      {/* List */}
      {chapters === undefined ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>
      ) : (filtered?.length ?? 0) === 0 ? (
        <p className="text-gray-500 font-text text-center py-16">No chapters yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered?.sort((a, b) => a.order - b.order).map((c) => (
            <div key={c._id} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold font-title flex-shrink-0">
                {c.order}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold font-title truncate">{c.title}</h3>
                <p className="text-gray-400 text-xs font-text">{getBookName(c.bookId)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(c)} className="px-3 py-1.5 bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-600/50 transition-colors text-sm font-text">Edit</button>
                <button onClick={() => handleDelete(c._id)} className="px-3 py-1.5 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

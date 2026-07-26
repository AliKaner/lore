"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ImageUpload } from "@/components/ImageUpload";

type Mode = "list" | "create" | "edit";

interface FormData {
  universeId: string;
  title: string;
  description: string;
  order: string;
  coverStorageId: string;
}

const EMPTY: FormData = { universeId: "", title: "", description: "", order: "", coverStorageId: "" };

export default function AdminBooks() {
  const { token } = useAdminAuth();
  const universes = useQuery(api.universes.list);
  const books = useQuery(api.books.list);
  const createMutation = useMutation(api.books.create);
  const updateMutation = useMutation(api.books.update);
  const removeMutation = useMutation(api.books.remove);

  const [mode, setMode] = useState<Mode>("list");
  const [editId, setEditId] = useState<Id<"books"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [filterUniverse, setFilterUniverse] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => { setForm(EMPTY); setEditId(null); setMode("create"); setError(""); };
  const openEdit = (b: any) => {
    setForm({
      universeId: b.universeId,
      title: b.title,
      description: b.description ?? "",
      order: b.order?.toString() ?? "",
      coverStorageId: b.coverStorageId ?? "",
    });
    setEditId(b._id);
    setMode("edit");
    setError("");
  };
  const cancel = () => { setMode("list"); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.universeId) return;
    setLoading(true);
    setError("");
    try {
      const data = {
        universeId: form.universeId as Id<"universes">,
        title: form.title,
        description: form.description || undefined,
        order: form.order ? parseInt(form.order) : undefined,
        coverStorageId: form.coverStorageId ? (form.coverStorageId as Id<"_storage">) : undefined,
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

  const handleDelete = async (id: Id<"books">) => {
    if (!token || !confirm("Delete this book?")) return;
    try {
      await removeMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = books?.filter(
    (b) => filterUniverse === "all" || b.universeId === filterUniverse
  );
  const getUniverseName = (id: string) =>
    universes?.find((u) => u._id === id)?.name ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-title">Books</h1>
        {mode === "list" && (
          <button onClick={openCreate} className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text">
            + Add Book
          </button>
        )}
      </div>

      {/* Form */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 font-title">
            {mode === "create" ? "New Book" : "Edit Book"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Universe *</label>
              <select
                value={form.universeId}
                onChange={(e) => setForm({ ...form, universeId: e.target.value })}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
              >
                <option value="">Select universe</option>
                {universes?.map((u) => (
                  <option key={u._id} value={u._id} className="bg-gray-900">{u.name}</option>
                ))}
              </select>
            </div>
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
              <label className="block text-sm text-gray-300 mb-1 font-text">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
              />
            </div>
            {token && (
              <ImageUpload
                sessionToken={token}
                currentImageUrl={undefined}
                onUpload={(id) => setForm({ ...form, coverStorageId: id })}
                label="Book Cover"
              />
            )}
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

      {/* Filter */}
      {mode === "list" && (
        <div className="mb-4">
          <select value={filterUniverse} onChange={(e) => setFilterUniverse(e.target.value)} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            <option value="all" className="bg-gray-900">All Universes</option>
            {universes?.map((u) => <option key={u._id} value={u._id} className="bg-gray-900">{u.name}</option>)}
          </select>
        </div>
      )}

      {/* List */}
      {books === undefined ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>
      ) : (filtered?.length ?? 0) === 0 ? (
        <p className="text-gray-500 font-text text-center py-16">No books yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((b) => (
            <div key={b._id} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-4">
              {b.coverUrl && <img src={b.coverUrl} alt={b.title} className="w-12 h-16 rounded object-cover flex-shrink-0" />}
              <div className="flex-1">
                <h3 className="text-white font-semibold font-title">{b.title}</h3>
                <p className="text-gray-400 text-xs font-text">{getUniverseName(b.universeId)}</p>
                {b.description && <p className="text-gray-500 text-sm font-text line-clamp-1">{b.description}</p>}
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/books/${b._id}/write`} className="px-3 py-1.5 bg-green-600/30 border border-green-500/30 rounded text-green-300 hover:bg-green-600/50 transition-colors text-sm font-text">📝 Stüdyoda Yaz</Link>
                <button onClick={() => openEdit(b)} className="px-3 py-1.5 bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-600/50 transition-colors text-sm font-text">Edit</button>
                <button onClick={() => handleDelete(b._id)} className="px-3 py-1.5 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

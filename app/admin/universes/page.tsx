"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ImageUpload } from "@/components/ImageUpload";

type Mode = "list" | "create" | "edit";

interface FormData {
  name: string;
  description: string;
  order: string;
  imageStorageId: string;
}

const EMPTY: FormData = { name: "", description: "", order: "", imageStorageId: "" };

export default function AdminUniverses() {
  const { token } = useAdminAuth();
  const universes = useQuery(api.universes.list);
  const createMutation = useMutation(api.universes.create);
  const updateMutation = useMutation(api.universes.update);
  const removeMutation = useMutation(api.universes.remove);

  const [mode, setMode] = useState<Mode>("list");
  const [editId, setEditId] = useState<Id<"universes"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => { setForm(EMPTY); setEditId(null); setMode("create"); setError(""); };
  const openEdit = (u: any) => {
    setForm({
      name: u.name,
      description: u.description ?? "",
      order: u.order?.toString() ?? "",
      imageStorageId: u.imageStorageId ?? "",
    });
    setEditId(u._id);
    setMode("edit");
    setError("");
  };
  const cancel = () => { setMode("list"); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = {
        name: form.name,
        description: form.description || undefined,
        order: form.order ? parseInt(form.order) : undefined,
        imageStorageId: form.imageStorageId ? (form.imageStorageId as Id<"_storage">) : undefined,
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

  const handleDelete = async (id: Id<"universes">) => {
    if (!token || !confirm("Delete this universe and all its content?")) return;
    try {
      await removeMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-title">Universes</h1>
        {mode === "list" && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text"
          >
            + Add Universe
          </button>
        )}
      </div>

      {/* Form */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 font-title">
            {mode === "create" ? "New Universe" : "Edit Universe"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/50"
              />
            </div>
            {token && (
              <ImageUpload
                sessionToken={token}
                currentImageUrl={undefined}
                onUpload={(id) => setForm({ ...form, imageStorageId: id })}
                label="Universe Image"
              />
            )}
            {error && <p className="text-red-400 text-sm font-text">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors disabled:opacity-50 font-text"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="px-6 py-2 bg-transparent border border-white/20 rounded-lg text-gray-400 hover:text-white transition-colors font-text"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {universes === undefined ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : universes.length === 0 ? (
        <p className="text-gray-500 font-text text-center py-16">No universes yet.</p>
      ) : (
        <div className="space-y-3">
          {universes
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((u) => (
              <div
                key={u._id}
                className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-4"
              >
                {u.imageUrl && (
                  <img
                    src={u.imageUrl}
                    alt={u.name}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-white font-semibold font-title">{u.name}</h3>
                  {u.description && (
                    <p className="text-gray-400 text-sm font-text line-clamp-1">{u.description}</p>
                  )}
                  <p className="text-gray-500 text-xs font-text">Order: {u.order ?? 0}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="px-3 py-1.5 bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-600/50 transition-colors text-sm font-text"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="px-3 py-1.5 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

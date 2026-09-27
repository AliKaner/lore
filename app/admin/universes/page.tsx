"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@/hooks/privateConvex";
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
  const universes = useQuery(api.universes.list, {});
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
        <h1 className="text-3xl font-bold text-[var(--ink)] font-title">Universes</h1>
        {mode === "list" && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors font-text"
          >
            + Add Universe
          </button>
        )}
      </div>

      {/* Form */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-6 font-title">
            {mode === "create" ? "New Universe" : "Edit Universe"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
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
            {error && <p className="text-[var(--danger)] text-sm font-text">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 font-text"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={cancel}
                className="px-6 py-2 bg-transparent border border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-text"
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
          <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--accent)] rounded-full animate-spin" />
        </div>
      ) : universes.length === 0 ? (
        <p className="text-[var(--muted-3)] font-text text-center py-16">No universes yet.</p>
      ) : (
        <div className="space-y-3">
          {universes
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((u) => (
              <div
                key={u._id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4"
              >
                {u.imageUrl && (
                  <img
                    src={u.imageUrl}
                    alt={u.name}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-[var(--ink)] font-semibold font-title">{u.name}</h3>
                  {u.description && (
                    <p className="text-[var(--muted)] text-sm font-text line-clamp-1">{u.description}</p>
                  )}
                  <p className="text-[var(--muted-3)] text-xs font-text">Order: {u.order ?? 0}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="px-3 py-1.5 bg-[var(--accent-soft)] border border-[var(--accent)] rounded text-[var(--accent-text)] hover:bg-[var(--accent-soft-hover)] transition-colors text-sm font-text"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="px-3 py-1.5 bg-[var(--danger-soft)] border border-[var(--danger-border)] rounded text-[var(--danger)] hover:bg-[var(--danger-soft-hover)] transition-colors text-sm font-text"
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

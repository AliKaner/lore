"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ImageUpload } from "@/components/ImageUpload";
import { ContentEditor } from "@/components/ContentEditor";

const TYPES = ["character", "city", "item", "story", "other", "location", "faction"] as const;
type LoreType = (typeof TYPES)[number];
type Mode = "list" | "create" | "edit";

interface FormData {
  universeId: string;
  categoryId: string;
  name: string;
  type: LoreType;
  contentTr: string;
  contentEn: string;
  order: string;
  imageStorageId: string;
  relatedEntryIds: string[];
}

const EMPTY: FormData = {
  universeId: "", categoryId: "", name: "", type: "other",
  contentTr: "", contentEn: "", order: "", imageStorageId: "", relatedEntryIds: [],
};

export default function AdminEntries() {
  const { token } = useAdminAuth();
  const universes = useQuery(api.universes.list, {});
  const categories = useQuery(api.categories.list, {});
  const entries = useQuery(api.loreEntries.list, {});
  const createMutation = useMutation(api.loreEntries.create);
  const updateMutation = useMutation(api.loreEntries.update);
  const removeMutation = useMutation(api.loreEntries.remove);

  const [mode, setMode] = useState<Mode>("list");
  const [editId, setEditId] = useState<Id<"loreEntries"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [filterUniverse, setFilterUniverse] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contentLang, setContentLang] = useState<"tr" | "en">("tr");

  const filteredCategories = categories?.filter(
    (c) => !form.universeId || c.universeId === form.universeId
  );

  const openCreate = () => { setForm(EMPTY); setEditId(null); setMode("create"); setError(""); };
  const openEdit = (e: any) => {
    setForm({
      universeId: e.universeId,
      categoryId: e.categoryId,
      name: e.name,
      type: e.type,
      contentTr: e.contentTr,
      contentEn: e.contentEn,
      order: e.order?.toString() ?? "",
      imageStorageId: e.imageStorageId ?? "",
      relatedEntryIds: e.relatedEntryIds ?? [],
    });
    setEditId(e._id);
    setMode("edit");
    setError("");
  };
  const cancel = () => { setMode("list"); setError(""); };

  // Auto-open an entry for editing when linked here with ?edit=<id> (e.g. from the graph view).
  const searchParams = useSearchParams();
  const autoEditHandled = useRef(false);
  useEffect(() => {
    const editParam = searchParams.get("edit");
    if (!editParam || autoEditHandled.current || !entries) return;
    const target = entries.find((e) => e._id === editParam);
    if (target) {
      openEdit(target);
      autoEditHandled.current = true;
    }
  }, [searchParams, entries]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!token || !form.universeId || !form.categoryId) return;
    setLoading(true);
    setError("");
    try {
      const data = {
        universeId: form.universeId as Id<"universes">,
        categoryId: form.categoryId as Id<"categories">,
        name: form.name,
        type: form.type,
        contentTr: form.contentTr,
        contentEn: form.contentEn,
        order: form.order ? parseInt(form.order) : undefined,
        imageStorageId: form.imageStorageId ? (form.imageStorageId as Id<"_storage">) : undefined,
        relatedEntryIds: form.relatedEntryIds as Id<"loreEntries">[],
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

  const handleDelete = async (id: Id<"loreEntries">) => {
    if (!token || !confirm("Delete this lore entry?")) return;
    try {
      await removeMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const listCats = categories?.filter(
    (c) => filterUniverse === "all" || c.universeId === filterUniverse
  );
  const filtered = entries?.filter((e) => {
    const u = filterUniverse === "all" || e.universeId === filterUniverse;
    const c = filterCategory === "all" || e.categoryId === filterCategory;
    const t = filterType === "all" || e.type === filterType;
    return u && c && t;
  });

  const getName = (arr: any[], id: string) => arr?.find((x) => x._id === id)?.name ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--ink)] font-title">Lore Entries</h1>
        {mode === "list" && (
          <button onClick={openCreate} className="px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors font-text">
            + Add Entry
          </button>
        )}
      </div>

      {/* Form */}
      {(mode === "create" || mode === "edit") && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-6 font-title">
            {mode === "create" ? "New Lore Entry" : "Edit Lore Entry"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">Universe *</label>
                <select
                  value={form.universeId}
                  onChange={(e) => setForm({ ...form, universeId: e.target.value, categoryId: "" })}
                  required
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none"
                >
                  <option value="">Select universe</option>
                  {universes?.map((u) => (
                    <option key={u._id} value={u._id} className="bg-[var(--surface)]">{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none"
                >
                  <option value="">Select category</option>
                  {filteredCategories?.map((c) => (
                    <option key={c._id} value={c._id} className="bg-[var(--surface)]">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as LoreType })}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[var(--surface)] capitalize">{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none"
              />
            </div>
            {/* Content with language tabs */}
            <div>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setContentLang("tr")}
                  className={`px-4 py-1 rounded text-sm font-text transition-colors ${contentLang === "tr" ? "bg-[var(--surface-hover)] text-[var(--ink)]" : "bg-[var(--surface)] text-[var(--muted)]"}`}
                >
                  Türkçe
                </button>
                <button
                  type="button"
                  onClick={() => setContentLang("en")}
                  className={`px-4 py-1 rounded text-sm font-text transition-colors ${contentLang === "en" ? "bg-[var(--surface-hover)] text-[var(--ink)]" : "bg-[var(--surface)] text-[var(--muted)]"}`}
                >
                  English
                </button>
              </div>
              {contentLang === "tr" ? (
                <ContentEditor
                  value={form.contentTr}
                  onChange={(v) => setForm({ ...form, contentTr: v })}
                  rows={10}
                  placeholder="Türkçe içerik..."
                  storageKey={mode === "create" ? "draft_admin_entry_tr" : undefined}
                />
              ) : (
                <ContentEditor
                  value={form.contentEn}
                  onChange={(v) => setForm({ ...form, contentEn: v })}
                  rows={10}
                  placeholder="English content..."
                  storageKey={mode === "create" ? "draft_admin_entry_en" : undefined}
                />
              )}
            </div>
            {form.universeId && (
              <div>
                <label className="block text-sm text-[var(--ink-soft)] mb-1 font-text">
                  İlgili Girdiler
                </label>
                <div className="max-h-48 overflow-y-auto bg-[var(--surface-3)] border border-[var(--border)] rounded-lg p-3 space-y-1">
                  {entries
                    ?.filter((e) => e.universeId === form.universeId && e._id !== editId)
                    .map((e) => (
                      <label
                        key={e._id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--surface-hover)] cursor-pointer text-sm font-text text-[var(--ink-soft)]"
                      >
                        <input
                          type="checkbox"
                          checked={form.relatedEntryIds.includes(e._id)}
                          onChange={(ev) =>
                            setForm({
                              ...form,
                              relatedEntryIds: ev.target.checked
                                ? [...form.relatedEntryIds, e._id]
                                : form.relatedEntryIds.filter((id) => id !== e._id),
                            })
                          }
                          className="accent-[var(--accent)]"
                        />
                        <span className="capitalize text-[var(--muted-3)]">{e.type}</span>
                        {e.name}
                      </label>
                    ))}
                  {entries?.filter((e) => e.universeId === form.universeId && e._id !== editId)
                    .length === 0 && (
                    <p className="text-[var(--muted-3)] text-sm font-text px-2 py-1">
                      Bu evrende başka girdi yok.
                    </p>
                  )}
                </div>
              </div>
            )}
            {token && (
              <ImageUpload
                sessionToken={token}
                currentImageUrl={undefined}
                onUpload={(id) => setForm({ ...form, imageStorageId: id })}
                label="Entry Image"
              />
            )}
            {error && <p className="text-[var(--danger)] text-sm font-text">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 font-text">
                {loading ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={cancel} className="px-6 py-2 bg-transparent border border-[var(--border)] rounded-lg text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-text">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      {mode === "list" && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={filterUniverse} onChange={(e) => { setFilterUniverse(e.target.value); setFilterCategory("all"); }} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--ink)] text-sm focus:outline-none">
            <option value="all" className="bg-[var(--surface)]">All Universes</option>
            {universes?.map((u) => <option key={u._id} value={u._id} className="bg-[var(--surface)]">{u.name}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--ink)] text-sm focus:outline-none">
            <option value="all" className="bg-[var(--surface)]">All Categories</option>
            {listCats?.map((c) => <option key={c._id} value={c._id} className="bg-[var(--surface)]">{c.name}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--ink)] text-sm focus:outline-none">
            <option value="all" className="bg-[var(--surface)]">All Types</option>
            {TYPES.map((t) => <option key={t} value={t} className="bg-[var(--surface)] capitalize">{t}</option>)}
          </select>
        </div>
      )}

      {/* List */}
      {entries === undefined ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--accent)] rounded-full animate-spin" /></div>
      ) : (filtered?.length ?? 0) === 0 ? (
        <p className="text-[var(--muted-3)] font-text text-center py-16">No entries yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((e) => (
            <div key={e._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4">
              {e.imageUrl && <img src={e.imageUrl} alt={e.name} className="w-14 h-14 rounded object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[var(--ink)] font-semibold font-title truncate">{e.name}</h3>
                  <span className="text-xs bg-[var(--surface-2)] text-[var(--ink-soft)] px-2 py-0.5 rounded capitalize">{e.type}</span>
                </div>
                <p className="text-[var(--muted)] text-xs font-text">
                  {getName(categories ?? [], e.categoryId)} Â· {getName(universes ?? [], e.universeId)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(e)} className="px-3 py-1.5 bg-[var(--accent-soft)] border border-[var(--accent)] rounded text-[var(--accent-text)] hover:bg-[var(--accent-soft-hover)] transition-colors text-sm font-text">Edit</button>
                <button onClick={() => handleDelete(e._id)} className="px-3 py-1.5 bg-[var(--danger-soft)] border border-[var(--danger-border)] rounded text-[var(--danger)] hover:bg-[var(--danger-soft-hover)] transition-colors text-sm font-text">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
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
  minPlayers: string;
  maxPlayers: string;
  rulesTr: string;
  rulesEn: string;
  order: string;
  coverStorageId: string;
}

const EMPTY: FormData = {
  universeId: "",
  title: "",
  description: "",
  minPlayers: "2",
  maxPlayers: "4",
  rulesTr: "",
  rulesEn: "",
  order: "",
  coverStorageId: "",
};

export default function AdminBoardGames() {
  const { token } = useAdminAuth();
  const universes = useQuery(api.universes.list);
  const games = useQuery(api.boardGames.list);
  const createMutation = useMutation(api.boardGames.create);
  const updateMutation = useMutation(api.boardGames.update);
  const removeMutation = useMutation(api.boardGames.remove);

  const [mode, setMode] = useState<Mode>("list");
  const [editId, setEditId] = useState<Id<"boardGames"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [filterUniverse, setFilterUniverse] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => { setForm(EMPTY); setEditId(null); setMode("create"); setError(""); };
  const openEdit = (g: any) => {
    setForm({
      universeId: g.universeId,
      title: g.title,
      description: g.description ?? "",
      minPlayers: String(g.minPlayers),
      maxPlayers: String(g.maxPlayers),
      rulesTr: g.rulesTr ?? "",
      rulesEn: g.rulesEn ?? "",
      order: g.order?.toString() ?? "",
      coverStorageId: g.coverStorageId ?? "",
    });
    setEditId(g._id);
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
        minPlayers: parseInt(form.minPlayers),
        maxPlayers: parseInt(form.maxPlayers),
        rulesTr: form.rulesTr || undefined,
        rulesEn: form.rulesEn || undefined,
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

  const handleDelete = async (id: Id<"boardGames">) => {
    if (!token || !confirm("Delete this board game?")) return;
    try {
      await removeMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = games?.filter(
    (g) => filterUniverse === "all" || g.universeId === filterUniverse
  );
  const getUniverseName = (id: string) =>
    universes?.find((u) => u._id === id)?.name ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-title">Board Games</h1>
        {mode === "list" && (
          <button onClick={openCreate} className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text">
            + Add Game
          </button>
        )}
      </div>

      {(mode === "create" || mode === "edit") && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 font-title">
            {mode === "create" ? "New Board Game" : "Edit Board Game"}
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
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-text">Min Players *</label>
                <input
                  type="number"
                  min={1}
                  value={form.minPlayers}
                  onChange={(e) => setForm({ ...form, minPlayers: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-text">Max Players *</label>
                <input
                  type="number"
                  min={1}
                  value={form.maxPlayers}
                  onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Rules (TR)</label>
              <textarea
                value={form.rulesTr}
                onChange={(e) => setForm({ ...form, rulesTr: e.target.value })}
                rows={6}
                placeholder="Oyun kuralları..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none resize-y font-text text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Rules (EN)</label>
              <textarea
                value={form.rulesEn}
                onChange={(e) => setForm({ ...form, rulesEn: e.target.value })}
                rows={6}
                placeholder="Game rules..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none resize-y font-text text-sm"
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
                label="Game Cover"
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

      {mode === "list" && (
        <div className="mb-4">
          <select value={filterUniverse} onChange={(e) => setFilterUniverse(e.target.value)} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
            <option value="all" className="bg-gray-900">All Universes</option>
            {universes?.map((u) => <option key={u._id} value={u._id} className="bg-gray-900">{u.name}</option>)}
          </select>
        </div>
      )}

      {games === undefined ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>
      ) : (filtered?.length ?? 0) === 0 ? (
        <p className="text-gray-500 font-text text-center py-16">No board games yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((g) => (
            <div key={g._id} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-4">
              {g.coverUrl ? (
                <img src={g.coverUrl} alt={g.title} className="w-16 h-16 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">🎲</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold font-title">{g.title}</h3>
                <p className="text-gray-400 text-xs font-text">{getUniverseName(g.universeId)}</p>
                <p className="text-gray-500 text-xs font-text">
                  {g.minPlayers === g.maxPlayers ? `${g.minPlayers}` : `${g.minPlayers}–${g.maxPlayers}`} oyuncu
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(g)} className="px-3 py-1.5 bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-600/50 transition-colors text-sm font-text">Edit</button>
                <button onClick={() => handleDelete(g._id)} className="px-3 py-1.5 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

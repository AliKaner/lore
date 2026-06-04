"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Mode = "list" | "create" | "edit";

interface FormData {
  boardGameId: string;
  name: string;
  description: string;
  levelCount: string;
  order: string;
}

const EMPTY: FormData = { boardGameId: "", name: "", description: "", levelCount: "3", order: "" };

export default function AdminCardTypes() {
  const { token } = useAdminAuth();
  const games = useQuery(api.boardGames.list);

  const [filterGameId, setFilterGameId] = useState("all");
  const [mode, setMode] = useState<Mode>("list");
  const [editId, setEditId] = useState<Id<"cardTypes"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedGameId = filterGameId !== "all" ? (filterGameId as Id<"boardGames">) : undefined;
  const cardTypes = useQuery(
    api.cardTypes.listByBoardGame,
    selectedGameId ? { boardGameId: selectedGameId } : "skip"
  );

  const createMutation = useMutation(api.cardTypes.create);
  const updateMutation = useMutation(api.cardTypes.update);
  const removeMutation = useMutation(api.cardTypes.remove);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setMode("create"); setError(""); };
  const openEdit = (t: any) => {
    setForm({
      boardGameId: t.boardGameId,
      name: t.name,
      description: t.description ?? "",
      levelCount: String(t.levelCount),
      order: t.order?.toString() ?? "",
    });
    setEditId(t._id);
    setMode("edit");
    setError("");
  };
  const cancel = () => { setMode("list"); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.boardGameId) return;
    setLoading(true);
    setError("");
    try {
      const data = {
        boardGameId: form.boardGameId as Id<"boardGames">,
        name: form.name,
        description: form.description || undefined,
        levelCount: parseInt(form.levelCount),
        order: form.order ? parseInt(form.order) : undefined,
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

  const handleDelete = async (id: Id<"cardTypes">) => {
    if (!token || !confirm("Delete this card type?")) return;
    try {
      await removeMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getGameName = (id: string) => games?.find((g) => g._id === id)?.title ?? id;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-title">Card Types</h1>
        {mode === "list" && (
          <button onClick={openCreate} className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text">
            + Add Type
          </button>
        )}
      </div>

      {(mode === "create" || mode === "edit") && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 font-title">
            {mode === "create" ? "New Card Type" : "Edit Card Type"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Board Game *</label>
              <select
                value={form.boardGameId}
                onChange={(e) => setForm({ ...form, boardGameId: e.target.value })}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
              >
                <option value="">Select board game</option>
                {games?.map((g) => (
                  <option key={g._id} value={g._id} className="bg-gray-900">{g.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Type Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="örn. Karakter Kartı, Silah Kartı..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none placeholder-gray-600"
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
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Level Count *</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.levelCount}
                onChange={(e) => setForm({ ...form, levelCount: e.target.value })}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1 font-text">Bu tip kaç seviyeye sahip? (örn. Karakter=5, Silah=3)</p>
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
          <select
            value={filterGameId}
            onChange={(e) => setFilterGameId(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >
            <option value="all" className="bg-gray-900">— Select a board game —</option>
            {games?.map((g) => <option key={g._id} value={g._id} className="bg-gray-900">{g.title}</option>)}
          </select>
        </div>
      )}

      {filterGameId === "all" && mode === "list" ? (
        <p className="text-gray-500 font-text text-center py-16">Bir board game seçin.</p>
      ) : cardTypes === undefined ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>
      ) : cardTypes.length === 0 ? (
        <p className="text-gray-500 font-text text-center py-16">No card types yet.</p>
      ) : (
        <div className="space-y-3">
          {cardTypes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((t) => (
            <div key={t._id} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold font-title">{t.name}</h3>
                <p className="text-gray-400 text-xs font-text">{getGameName(t.boardGameId)}</p>
                <p className="text-gray-500 text-xs font-text">{t.levelCount} seviye</p>
                {t.description && <p className="text-gray-500 text-sm font-text line-clamp-1 mt-0.5">{t.description}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(t)} className="px-3 py-1.5 bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-600/50 transition-colors text-sm font-text">Edit</button>
                <button onClick={() => handleDelete(t._id)} className="px-3 py-1.5 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ImageUpload } from "@/components/ImageUpload";

type Mode = "list" | "create" | "edit";

interface FormData {
  boardGameId: string;
  cardTypeId: string;
  name: string;
  level: string;
  orientation: "vertical" | "horizontal";
  descriptionTr: string;
  descriptionEn: string;
  order: string;
  imageStorageId: string;
}

const EMPTY: FormData = {
  boardGameId: "",
  cardTypeId: "",
  name: "",
  level: "1",
  orientation: "vertical",
  descriptionTr: "",
  descriptionEn: "",
  order: "",
  imageStorageId: "",
};

export default function AdminCards() {
  const { token } = useAdminAuth();
  const games = useQuery(api.boardGames.list);

  const [filterGameId, setFilterGameId] = useState("all");
  const [filterTypeId, setFilterTypeId] = useState("all");
  const [mode, setMode] = useState<Mode>("list");
  const [editId, setEditId] = useState<Id<"cards"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedGameId = filterGameId !== "all" ? (filterGameId as Id<"boardGames">) : undefined;
  const cardTypes = useQuery(
    api.cardTypes.listByBoardGame,
    selectedGameId ? { boardGameId: selectedGameId } : "skip"
  );

  const cards = useQuery(
    api.cards.listByBoardGame,
    selectedGameId ? { boardGameId: selectedGameId } : "skip"
  );

  const formGameId = form.boardGameId !== "" ? (form.boardGameId as Id<"boardGames">) : undefined;
  const formCardTypes = useQuery(
    api.cardTypes.listByBoardGame,
    formGameId ? { boardGameId: formGameId } : "skip"
  );

  const selectedFormCardType = formCardTypes?.find((t) => t._id === form.cardTypeId);
  const levelOptions = selectedFormCardType
    ? Array.from({ length: selectedFormCardType.levelCount }, (_, i) => i + 1)
    : [1];

  useEffect(() => {
    if (form.cardTypeId && selectedFormCardType) {
      const lvl = parseInt(form.level);
      if (lvl > selectedFormCardType.levelCount) {
        setForm((f) => ({ ...f, level: "1" }));
      }
    }
  }, [form.cardTypeId, selectedFormCardType]);

  const createMutation = useMutation(api.cards.create);
  const updateMutation = useMutation(api.cards.update);
  const removeMutation = useMutation(api.cards.remove);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setMode("create"); setError(""); };
  const openEdit = (c: any) => {
    setForm({
      boardGameId: c.boardGameId,
      cardTypeId: c.cardTypeId,
      name: c.name,
      level: String(c.level),
      orientation: c.orientation ?? "vertical",
      descriptionTr: c.descriptionTr ?? "",
      descriptionEn: c.descriptionEn ?? "",
      order: c.order?.toString() ?? "",
      imageStorageId: c.imageStorageId ?? "",
    });
    setEditId(c._id);
    setMode("edit");
    setError("");
  };
  const cancel = () => { setMode("list"); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.boardGameId || !form.cardTypeId) return;
    setLoading(true);
    setError("");
    try {
      const data = {
        boardGameId: form.boardGameId as Id<"boardGames">,
        cardTypeId: form.cardTypeId as Id<"cardTypes">,
        name: form.name,
        level: parseInt(form.level),
        orientation: form.orientation,
        descriptionTr: form.descriptionTr || undefined,
        descriptionEn: form.descriptionEn || undefined,
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

  const handleDelete = async (id: Id<"cards">) => {
    if (!token || !confirm("Delete this card?")) return;
    try {
      await removeMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getTypeName = (id: string) =>
    cardTypes?.find((t) => t._id === id)?.name ?? id;

  const filteredCards = cards?.filter(
    (c) => filterTypeId === "all" || c.cardTypeId === filterTypeId
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white font-title">Cards</h1>
        {mode === "list" && (
          <button onClick={openCreate} className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text">
            + Add Card
          </button>
        )}
      </div>

      {(mode === "create" || mode === "edit") && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 font-title">
            {mode === "create" ? "New Card" : "Edit Card"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Board Game *</label>
              <select
                value={form.boardGameId}
                onChange={(e) => setForm({ ...form, boardGameId: e.target.value, cardTypeId: "", level: "1" })}
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
              <label className="block text-sm text-gray-300 mb-1 font-text">Card Type *</label>
              <select
                value={form.cardTypeId}
                onChange={(e) => setForm({ ...form, cardTypeId: e.target.value, level: "1" })}
                required
                disabled={!form.boardGameId}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none disabled:opacity-40"
              >
                <option value="">Select card type</option>
                {formCardTypes?.map((t) => (
                  <option key={t._id} value={t._id} className="bg-gray-900">
                    {t.name} ({t.levelCount} seviye)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-text">Card Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-text">
                  Level *{selectedFormCardType && ` (1–${selectedFormCardType.levelCount})`}
                </label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  required
                  disabled={!form.cardTypeId}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none disabled:opacity-40"
                >
                  {levelOptions.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-gray-900">Seviye {lvl}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Orientation *</label>
              <div className="flex gap-3">
                {(["vertical", "horizontal"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setForm({ ...form, orientation: o })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-text transition-colors ${
                      form.orientation === o
                        ? "bg-white/30 border-white/50 text-white"
                        : "bg-white/5 border-white/20 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {o === "vertical" ? "▮ Dikey" : "▬ Yatay"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Description (TR)</label>
              <textarea
                value={form.descriptionTr}
                onChange={(e) => setForm({ ...form, descriptionTr: e.target.value })}
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">Description (EN)</label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                rows={2}
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
                onUpload={(id) => setForm({ ...form, imageStorageId: id })}
                label="Card Image"
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
        <div className="flex gap-3 mb-4">
          <select
            value={filterGameId}
            onChange={(e) => { setFilterGameId(e.target.value); setFilterTypeId("all"); }}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
          >
            <option value="all" className="bg-gray-900">— Select board game —</option>
            {games?.map((g) => <option key={g._id} value={g._id} className="bg-gray-900">{g.title}</option>)}
          </select>
          {filterGameId !== "all" && (
            <select
              value={filterTypeId}
              onChange={(e) => setFilterTypeId(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
            >
              <option value="all" className="bg-gray-900">All Types</option>
              {cardTypes?.map((t) => <option key={t._id} value={t._id} className="bg-gray-900">{t.name}</option>)}
            </select>
          )}
        </div>
      )}

      {filterGameId === "all" && mode === "list" ? (
        <p className="text-gray-500 font-text text-center py-16">Bir board game seçin.</p>
      ) : cards === undefined ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>
      ) : (filteredCards?.length ?? 0) === 0 ? (
        <p className="text-gray-500 font-text text-center py-16">No cards yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredCards?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((c) => (
            <div key={c._id} className="bg-white/10 border border-white/20 rounded-xl overflow-hidden">
              <div className={`relative bg-gray-800 ${c.orientation === "horizontal" ? "aspect-[3/2]" : "aspect-[2/3]"}`}>
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-600">🃏</div>
                )}
                <span className="absolute top-1.5 right-1.5 bg-black/60 text-yellow-300 text-xs px-1.5 py-0.5 rounded font-text">
                  Sv.{c.level}
                </span>
                <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white/50 text-xs px-1.5 py-0.5 rounded font-text">
                  {c.orientation === "horizontal" ? "▬" : "▮"}
                </span>
              </div>
              <div className="p-2">
                <p className="text-white text-xs font-semibold font-title truncate">{c.name}</p>
                <p className="text-gray-500 text-xs font-text">{getTypeName(c.cardTypeId)}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => openEdit(c)} className="flex-1 py-1 bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-600/50 transition-colors text-xs font-text">Edit</button>
                  <button onClick={() => handleDelete(c._id)} className="flex-1 py-1 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-xs font-text">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

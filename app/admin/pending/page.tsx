"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminPendingPage() {
  const { token } = useAdminAuth();

  const entries = useQuery(api.loreEntries.list);
  const chapters = useQuery(api.chapters.list);
  const requests = useQuery(
    api.writerRequests.list,
    token ? { sessionToken: token } : "skip"
  );
  const updateEntry = useMutation(api.loreEntries.update);
  const removeEntry = useMutation(api.loreEntries.remove);
  const updateChapter = useMutation(api.chapters.update);
  const removeChapter = useMutation(api.chapters.remove);

  const [busyId, setBusyId] = useState<string | null>(null);

  const writerName = (id?: Id<"writerRequests">) =>
    requests?.find((r) => r._id === id)?.name ?? "Bilinmeyen yazar";

  const pendingEntries = entries?.filter((e) => e.status === "pending");
  const pendingChapters = chapters?.filter((c) => c.status === "pending");

  const loading = entries === undefined || chapters === undefined;
  const isEmpty =
    !loading && (pendingEntries?.length ?? 0) === 0 && (pendingChapters?.length ?? 0) === 0;

  const approveEntry = async (id: Id<"loreEntries">) => {
    if (!token) return;
    setBusyId(id);
    try {
      await updateEntry({ id, status: "published", sessionToken: token });
    } finally {
      setBusyId(null);
    }
  };

  const deleteEntry = async (id: Id<"loreEntries">) => {
    if (!token || !confirm("Bu taslağı sil?")) return;
    setBusyId(id);
    try {
      await removeEntry({ id, sessionToken: token });
    } finally {
      setBusyId(null);
    }
  };

  const approveChapter = async (id: Id<"chapters">) => {
    if (!token) return;
    setBusyId(id);
    try {
      await updateChapter({ id, status: "published", sessionToken: token });
    } finally {
      setBusyId(null);
    }
  };

  const deleteChapter = async (id: Id<"chapters">) => {
    if (!token || !confirm("Bu taslağı sil?")) return;
    setBusyId(id);
    try {
      await removeChapter({ id, sessionToken: token });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-title">Onay Bekleyen Gönderimler</h1>
        <p className="text-gray-400 text-sm font-text mt-1">
          Yazarların gönderdiği lore girdileri ve bölümler, onaylanana kadar sitede görünmez.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {isEmpty && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400 font-text">
          Onay bekleyen bir şey yok.
        </div>
      )}

      {(pendingEntries?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white font-title mb-3">Lore Girdileri</h2>
          <div className="space-y-3">
            {pendingEntries!.map((e: any) => (
              <div key={e._id} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-4">
                {e.imageUrl && (
                  <img src={e.imageUrl} alt={e.name} className="w-14 h-14 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold font-title truncate">{e.name}</h3>
                    <span className="text-xs bg-white/20 text-gray-300 px-2 py-0.5 rounded capitalize">{e.type}</span>
                  </div>
                  <p className="text-gray-400 text-xs font-text">Gönderen: {writerName(e.submittedByWriterId)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveEntry(e._id)}
                    disabled={busyId === e._id}
                    className="px-3 py-1.5 bg-green-600/30 border border-green-500/30 rounded text-green-300 hover:bg-green-600/50 transition-colors text-sm font-text disabled:opacity-50"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => deleteEntry(e._id)}
                    disabled={busyId === e._id}
                    className="px-3 py-1.5 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(pendingChapters?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white font-title mb-3">Bölümler</h2>
          <div className="space-y-3">
            {pendingChapters!.map((c: any) => (
              <div key={c._id} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold font-title truncate">{c.title}</h3>
                  <p className="text-gray-400 text-xs font-text">Gönderen: {writerName(c.submittedByWriterId)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveChapter(c._id)}
                    disabled={busyId === c._id}
                    className="px-3 py-1.5 bg-green-600/30 border border-green-500/30 rounded text-green-300 hover:bg-green-600/50 transition-colors text-sm font-text disabled:opacity-50"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => deleteChapter(c._id)}
                    disabled={busyId === c._id}
                    className="px-3 py-1.5 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

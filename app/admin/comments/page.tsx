"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminCommentsPage() {
  const { token } = useAdminAuth();
  const comments = useQuery(
    api.comments.listAll,
    token ? { sessionToken: token } : "skip"
  );
  const removeMutation = useMutation(api.comments.remove);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDelete = async (id: Id<"comments">) => {
    if (!token || !confirm("Bu yorumu sil?")) return;
    setBusyId(id);
    try {
      await removeMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message || "Bir hata oluştu");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white font-title">Yorumlar</h1>
        <p className="text-gray-400 text-sm font-text mt-1">
          Sitedeki tüm yorumlar. Uygunsuz veya spam olanları buradan silebilirsin.
        </p>
      </div>

      {comments === undefined && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {comments !== undefined && comments.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400 font-text">
          Henüz hiç yorum yok.
        </div>
      )}

      {comments && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c: any) => (
            <div key={c._id} className="bg-white/10 border border-white/20 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold font-title">{c.name}</span>
                    <span className="text-xs text-gray-500 font-text">{c.email}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-text mt-0.5">
                    {c.targetLabel
                      ? `${c.targetType === "chapter" ? "Bölüm" : "Lore"}: ${c.targetLabel}`
                      : "Hedef bulunamadı (silinmiş olabilir)"}
                    {" · "}
                    {new Date(c.createdAt).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(c._id)}
                  disabled={busyId === c._id}
                  className="px-3 py-1.5 bg-red-600/30 border border-red-500/30 rounded text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text disabled:opacity-50 flex-shrink-0"
                >
                  Sil
                </button>
              </div>
              <p className="text-gray-300 font-text text-sm bg-black/20 rounded-lg p-3 whitespace-pre-wrap border border-white/5">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const STATUS_LABEL: Record<string, string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  approved: "bg-green-500/10 border-green-500/30 text-green-300",
  rejected: "bg-red-500/10 border-red-500/30 text-red-300",
};

export default function AdminRequestsPage() {
  const { token } = useAdminAuth();

  const requests = useQuery(
    api.writerRequests.list,
    token ? { sessionToken: token } : "skip"
  );
  const approveMutation = useMutation(api.writerRequests.approve);
  const rejectMutation = useMutation(api.writerRequests.reject);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ name: string; email: string; password: string } | null>(null);

  const handleApprove = async (id: Id<"writerRequests">, name: string, email: string) => {
    if (!token) return;
    setBusyId(id);
    try {
      const { password } = await approveMutation({ id, sessionToken: token });
      setRevealed({ name, email, password });
    } catch (err: any) {
      alert(err.message || "Bir hata oluştu");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: Id<"writerRequests">) => {
    if (!token || !confirm("Bu başvuruyu reddetmek istediğine emin misin?")) return;
    setBusyId(id);
    try {
      await rejectMutation({ id, sessionToken: token });
    } catch (err: any) {
      alert(err.message || "Bir hata oluştu");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-title">Lore Yazarı Başvuruları</h1>
          <p className="text-gray-400 text-sm font-text mt-1">
            Yazar olmak isteyen kullanıcıların gönderdiği başvurular.
          </p>
        </div>
      </div>

      {requests === undefined && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {requests !== undefined && requests.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400 font-text">
          Henüz hiç başvuru bulunmuyor.
        </div>
      )}

      {requests && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((req) => {
            const status = req.status ?? "pending";
            return (
              <div
                key={req._id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-title">{req.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-text ${STATUS_STYLE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                    <a
                      href={`mailto:${req.email}`}
                      className="text-sm text-blue-400 hover:text-blue-300 font-text flex items-center gap-1.5 mt-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {req.email}
                    </a>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-text uppercase block">Başvuru Tarihi</span>
                    <span className="text-sm text-gray-300 font-text font-semibold">
                      {new Date(req.createdAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-xs text-gray-500 font-text uppercase block mb-1">Açıklama / Mesaj</span>
                  <p className="text-gray-300 font-text text-sm bg-black/20 rounded-lg p-4 whitespace-pre-wrap border border-white/5 leading-relaxed">
                    {req.message || <span className="text-gray-550 italic">Mesaj belirtilmemiş.</span>}
                  </p>
                </div>

                {status === "pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(req._id, req.name, req.email)}
                      disabled={busyId === req._id}
                      className="px-4 py-2 bg-green-600/30 border border-green-500/30 rounded-lg text-green-300 hover:bg-green-600/50 transition-colors text-sm font-text disabled:opacity-50"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      disabled={busyId === req._id}
                      className="px-4 py-2 bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-600/50 transition-colors text-sm font-text disabled:opacity-50"
                    >
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {revealed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-2 font-title">Yazar Onaylandı</h3>
            <p className="text-gray-400 text-sm font-text mb-4">
              Bu parola bir daha gösterilmeyecek — {revealed.name} ({revealed.email}) kişisine
              kendin ilet.
            </p>
            <div className="bg-black/30 border border-white/10 rounded-lg p-4 mb-4 flex items-center justify-between gap-3">
              <code className="text-lg text-white font-mono tracking-wide">{revealed.password}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(revealed.password)}
                className="px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm hover:bg-white/20 transition-colors font-text flex-shrink-0"
              >
                Kopyala
              </button>
            </div>
            <button
              onClick={() => setRevealed(null)}
              className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors font-text"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminRequestsPage() {
  const { token } = useAdminAuth();

  const requests = useQuery(
    api.writerRequests.list,
    token ? { sessionToken: token } : "skip"
  );

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
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-lg"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-title">{req.name}</h3>
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

              <div>
                <span className="text-xs text-gray-500 font-text uppercase block mb-1">Açıklama / Mesaj</span>
                <p className="text-gray-300 font-text text-sm bg-black/20 rounded-lg p-4 whitespace-pre-wrap border border-white/5 leading-relaxed">
                  {req.message || <span className="text-gray-550 italic">Mesaj belirtilmemiş.</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

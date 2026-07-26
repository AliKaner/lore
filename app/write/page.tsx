"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useWriterAuth } from "@/hooks/useWriterAuth";

export default function WriteDashboard() {
  const { token } = useWriterAuth();
  const writer = useQuery(
    api.writerAuth.verifyWriterSession,
    token ? { token } : "skip"
  );
  const submissions = useQuery(
    api.writerContent.myPendingSubmissions,
    token ? { writerToken: token } : "skip"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-title mb-1">
          Hoş geldin{writer ? `, ${writer.name}` : ""}
        </h1>
        <p className="text-gray-400 font-text">
          Buradan yeni lore girdisi veya bölüm ekleyebilirsin. Eklediğin içerik admin
          onayladıktan sonra sitede yayınlanır.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/write/lore/new"
          className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 hover:border-white/30 transition-all"
        >
          <span className="text-3xl mb-2 block">📜</span>
          <p className="text-white font-semibold font-title">Yeni Lore Girdisi</p>
          <p className="text-gray-400 text-sm font-text mt-1">
            Karakter, şehir, eşya veya hikaye ekle
          </p>
        </Link>
        <Link
          href="/write/chapters/new"
          className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 hover:border-white/30 transition-all"
        >
          <span className="text-3xl mb-2 block">📖</span>
          <p className="text-white font-semibold font-title">Yeni Bölüm</p>
          <p className="text-gray-400 text-sm font-text mt-1">
            Var olan bir kitaba yeni bölüm ekle
          </p>
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white font-title mb-2">
          Referans için siteye göz at
        </h2>
        <p className="text-gray-400 text-sm font-text mb-4">
          Yazmadan önce var olan evrenleri, karakterleri ve bölümleri incelemek
          isteyebilirsin — hepsi public sitede.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-text hover:bg-white/20 transition-colors"
        >
          Siteyi Aç →
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white font-title mb-4">Gönderdiklerim</h2>
        {submissions === undefined ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : submissions.entries.length === 0 && submissions.chapters.length === 0 ? (
          <p className="text-gray-500 font-text text-center py-10">
            Henüz bir şey göndermedin.
          </p>
        ) : (
          <div className="space-y-3">
            {submissions.entries.map((e: Doc<"loreEntries">) => (
              <div
                key={e._id}
                className="bg-white/10 border border-white/20 rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-white font-semibold font-title truncate">{e.name}</p>
                  <p className="text-gray-400 text-xs font-text capitalize">Lore · {e.type}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
            {submissions.chapters.map((c: Doc<"chapters">) => (
              <div
                key={c._id}
                className="bg-white/10 border border-white/20 rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-white font-semibold font-title truncate">{c.title}</p>
                  <p className="text-gray-400 text-xs font-text">Bölüm</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: "pending" | "published" }) {
  if (status === "pending") {
    return (
      <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-text">
        Beklemede
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-300 font-text">
      Yayında
    </span>
  );
}

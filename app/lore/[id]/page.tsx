"use client";
import React, { use, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import LoreContent from "@/components/LoreContent";
import ShareButton from "@/components/ShareButton";
import CommentSection from "@/components/CommentSection";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function LoreDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const entryId = id as Id<"loreEntries">;
  const entry = useQuery(api.loreEntries.getById, { id: entryId });
  const incrementViews = useMutation(api.loreEntries.incrementViews);

  useEffect(() => {
    if (entryId) {
      incrementViews({ id: entryId }).catch((err) => {
        console.error("Failed to increment views:", err);
      });
    }
  }, [entryId, incrementViews]);

  if (entry === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (entry === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 font-title">Lore Not Found</h1>
            <Link href="/" className="px-6 py-3 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const backHref = entry.universe ? `/universe/${entry.universeId}` : "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <Link href={backHref} className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {entry.universe ? `Back to ${entry.universe.name}` : "Back to Home"}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/20 text-white text-sm rounded-full capitalize font-text">{entry.type}</span>
                {entry.category && <span className="text-gray-400 font-text text-sm">{entry.category.name}</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 font-title">{entry.name}</h1>
              {entry.universe && <p className="text-gray-400 font-text">Universe: {entry.universe.name}</p>}
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
              <LoreContent content={{ tr: entry.contentTr, en: entry.contentEn }} />
            </div>

            {entry.relatedEntries && entry.relatedEntries.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 font-title">Related Entries</h3>
                <div className="grid grid-cols-2 gap-3">
                  {entry.relatedEntries.map((rel: any) => (
                    <Link key={rel._id} href={`/lore/${rel._id}`} className="flex items-center gap-2 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                      {rel.imageUrl && <img src={rel.imageUrl} alt={rel.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <div>
                        <p className="text-white text-sm font-semibold font-title">{rel.name}</p>
                        <p className="text-gray-400 text-xs capitalize font-text">{rel.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="relative h-96 lg:h-[500px] bg-gray-700 rounded-lg overflow-hidden">
              {entry.imageUrl ? (
                <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-8xl">
                  {entry.type === "character" && "👤"}
                  {entry.type === "city" && "🏰"}
                  {entry.type === "item" && "⚔️"}
                  {entry.type === "story" && "📖"}
                  {entry.type === "other" && "✨"}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>

        <CommentSection
          targetId={entryId}
          initialLikeCount={entry.likeCount ?? 0}
          viewsCount={entry.views ?? 0}
        />

        <div className="flex justify-between mt-12">
          <Link href={backHref} className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all">
            Back
          </Link>
          <ShareButton />
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { use, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import LoreContent from "@/components/LoreContent";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";
import { useQuery, useMutation } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/hooks/useLocale";

const TYPE_LABEL_KEYS: Record<string, string> = {
  character: "universe.typeCharacter",
  city: "universe.typeCity",
  item: "universe.typeItem",
  story: "universe.typeStory",
  other: "universe.typeOther",
  location: "universe.typeLocation",
  faction: "universe.typeFaction",
};

export default function LoreDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const entryId = id as Id<"loreEntries">;
  const { t } = useLocale();
  const entry = useQuery(api.loreEntries.getById, { id: entryId });
  const universeEntries = useQuery(
    api.loreEntries.listByUniverse,
    entry?.universeId ? { universeId: entry.universeId } : "skip"
  );
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
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--accent)] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (entry === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-[var(--ink)]">
            <h1 className="text-4xl font-bold mb-4 font-title">{t("lore.notFound")}</h1>
            <Link href="/" className="px-6 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all">
              {t("lore.backHome")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const backHref = entry.universe ? `/universe/${entry.universeId}` : "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)] flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-16 flex-1 w-full">
        <Link href={backHref} className="inline-flex items-center text-[var(--accent-text)] hover:text-[var(--accent-text-hover)] mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {entry.universe ? t("lore.backToUniverse", { name: entry.universe.name }) : t("lore.backHome")}
        </Link>

        {entry.status === "pending" && (
          <div className="mb-8 px-4 py-3 bg-[var(--warning-soft)] border border-[var(--warning-border)] rounded-lg text-[var(--warning-text)] text-sm font-text">
            {t("lore.pendingBanner")}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-[var(--surface-2)] text-[var(--ink)] text-sm rounded-full font-text">{t(TYPE_LABEL_KEYS[entry.type])}</span>
                {entry.category && <span className="text-[var(--muted)] font-text text-sm">{entry.category.name}</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--ink)] mb-2 font-title">{entry.name}</h1>
              {entry.universe && <p className="text-[var(--muted)] font-text">{t("lore.universeLabel", { name: entry.universe.name })}</p>}
            </div>

            <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-lg p-8">
              <LoreContent
                content={{ tr: entry.contentTr, en: entry.contentEn }}
                entries={(universeEntries ?? [])
                  .filter((e) => e._id !== entryId)
                  .map((e) => ({ id: e._id, name: e.name }))}
              />
            </div>

            {entry.relatedEntries && entry.relatedEntries.length > 0 && (
              <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-lg p-6">
                <h3 className="text-lg font-bold text-[var(--ink)] mb-4 font-title">{t("lore.relatedEntries")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {entry.relatedEntries.map((rel: any) => (
                    <Link key={rel._id} href={`/lore/${rel._id}`} className="flex items-center gap-2 bg-[var(--surface)] rounded-lg p-3 hover:bg-[var(--surface-hover)] transition-colors">
                      {rel.imageUrl && <img src={rel.imageUrl} alt={rel.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <div>
                        <p className="text-[var(--ink)] text-sm font-semibold font-title">{rel.name}</p>
                        <p className="text-[var(--muted)] text-xs font-text">{t(TYPE_LABEL_KEYS[rel.type])}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="relative h-96 lg:h-[500px] bg-[var(--border)] rounded-lg overflow-hidden">
              {entry.imageUrl ? (
                <img src={entry.imageUrl} alt={entry.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted-2)] text-8xl">
                  {entry.type === "character" && "👤"}
                  {entry.type === "city" && "🏰"}
                  {entry.type === "item" && "⚔️"}
                  {entry.type === "story" && "📖"}
                  {entry.type === "other" && "✨"}
                  {entry.type === "location" && "🗺️"}
                  {entry.type === "faction" && "🛡️"}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-12">
          <Link href={backHref} className="px-6 py-3 bg-[var(--surface-2)] backdrop-blur-md border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all">
            {t("lore.back")}
          </Link>
          <ShareButton />
        </div>
      </div>
      <Footer />
    </div>
  );
}

"use client";
import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoreContent from "@/components/LoreContent";
import { useQuery, useMutation } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/hooks/useLocale";

const countWords = (text: string) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export default function ChapterClient({ params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
  const { bookId: bookIdRaw, chapterId: chapterIdRaw } = use(params);
  const bookId = bookIdRaw as Id<"books">;
  const chapterId = chapterIdRaw as Id<"chapters">;

  const [lang, setLang] = useState<"tr" | "en">("tr");
  const { t } = useLocale();

  const chapter = useQuery(api.chapters.getById, { id: chapterId });
  const book = useQuery(api.books.getById, { id: bookId });
  const loreEntries = useQuery(
    api.loreEntries.listByUniverse,
    book?.universeId ? { universeId: book.universeId } : "skip"
  );
  const incrementViews = useMutation(api.chapters.incrementViews);

  useEffect(() => {
    if (chapterId) {
      incrementViews({ id: chapterId }).catch((err) => {
        console.error("Failed to increment views:", err);
      });
    }
  }, [chapterId, incrementViews]);

  if (chapter === undefined || book === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--accent)] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (chapter === null || book === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-[var(--ink)]">
            <h1 className="text-4xl font-bold mb-4 font-title">{t("chapter.notFound")}</h1>
            <Link href={`/book/${bookId}`} className="text-[var(--accent-text)] hover:text-[var(--accent-text-hover)]">{t("chapter.backToBook")}</Link>
          </div>
        </div>
      </div>
    );
  }

  const allChapters = chapter.allChapters ?? [];
  const currentIndex = allChapters.findIndex((c) => c._id === chapterId);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const activeContent = lang === "tr" ? chapter.contentTr : chapter.contentEn;
  const wordCount = countWords(activeContent);
  const readingTime = Math.ceil(wordCount / 80);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)] flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 flex-1 w-full">
        <Link href={`/book/${bookId}`} className="inline-flex items-center text-[var(--accent-text)] hover:text-[var(--accent-text-hover)] mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("chapter.backToBook")}
        </Link>

        {chapter.status === "pending" && (
          <div className="mb-8 px-4 py-3 bg-[var(--warning-soft)] border border-[var(--warning-border)] rounded-lg text-[var(--warning-text)] text-sm font-text">
            {t("chapter.pendingBanner")}
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--ink)] mb-4 font-title">{chapter.title}</h1>
          <p className="text-xl text-[var(--muted)] font-text mb-2">{book.title}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--ink-soft)] font-text mt-3 bg-[var(--surface-3)] border border-[var(--border)] py-2 px-5 rounded-full max-w-fit mx-auto shadow-inner">
            <span>👁️ {t("chapter.views", { count: chapter.views ?? 0 })}</span>
            <span className="text-[var(--warning-text)]">•</span>
            <span>📖 {t("chapter.words", { count: wordCount.toLocaleString("tr-TR") })}</span>
            <span className="text-[var(--warning-text)]">•</span>
            <span>⏱️ {t("chapter.readingTime", { count: readingTime })}</span>
            {currentIndex >= 0 && (
              <>
                <span className="text-[var(--warning-text)]">•</span>
                <span>{t("chapter.chapterOf", { current: currentIndex + 1, total: allChapters.length })}</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-lg p-8 mb-8">
          <LoreContent
            content={{ tr: chapter.contentTr, en: chapter.contentEn }}
            lang={lang}
            onLangChange={setLang}
            entries={(loreEntries ?? []).map((e) => ({ id: e._id, name: e.name }))}
          />
        </div>

        <div className="flex justify-between items-center mb-12">
          <div>
            {prevChapter ? (
              <Link href={`/book/${bookId}/${prevChapter._id}`} className="px-6 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all">
                {t("chapter.prev")}
              </Link>
            ) : <div />}
          </div>
          <div>
            {nextChapter ? (
              <Link href={`/book/${bookId}/${nextChapter._id}`} className="px-6 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all">
                {t("chapter.next")}
              </Link>
            ) : <div />}
          </div>
        </div>

        {allChapters.length > 0 && (
          <div className="mt-8 pt-8 border-t border-[var(--border)]">
            <h3 className="text-2xl font-bold text-[var(--ink)] mb-6 font-title text-center">{t("chapter.allChapters")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allChapters.map((ch, index) => (
                <Link
                  key={ch._id}
                  href={`/book/${bookId}/${ch._id}`}
                  className={`group bg-[var(--surface-3)] border rounded-lg p-4 hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all ${ch._id === chapterId ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--muted)] font-text">{t("chapter.chapterLabel", { n: index + 1 })}</span>
                    {ch._id === chapterId && <span className="text-xs text-[var(--accent-text)] font-text">{t("chapter.current")}</span>}
                  </div>
                  <h4 className="text-base font-semibold text-[var(--ink)] group-hover:text-[var(--accent-text-hover)] transition-colors font-title">{ch.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

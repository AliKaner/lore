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
      <div className="min-h-screen bg-gradient-to-br from-[#f6f7f1] via-[#f2f4ec] to-[#eef1e6]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-[#dce1d4] border-t-[#3f5e4b] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (chapter === null || book === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f6f7f1] via-[#f2f4ec] to-[#eef1e6]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-[#343831]">
            <h1 className="text-4xl font-bold mb-4 font-title">{t("chapter.notFound")}</h1>
            <Link href={`/book/${bookId}`} className="text-[#4b6a56] hover:text-[#35533f]">{t("chapter.backToBook")}</Link>
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
    <div className="min-h-screen bg-gradient-to-br from-[#f6f7f1] via-[#f2f4ec] to-[#eef1e6] flex flex-col">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16 flex-1 w-full">
        <Link href={`/book/${bookId}`} className="inline-flex items-center text-[#4b6a56] hover:text-[#35533f] mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("chapter.backToBook")}
        </Link>

        {chapter.status === "pending" && (
          <div className="mb-8 px-4 py-3 bg-[#f8f3e4] border border-[#e3d3a6] rounded-lg text-[#8c7332] text-sm font-text">
            {t("chapter.pendingBanner")}
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#343831] mb-4 font-title">{chapter.title}</h1>
          <p className="text-xl text-[#8b9681] font-text mb-2">{book.title}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#5c6653] font-text mt-3 bg-[#f6f7f2] border border-[#e5e7dd] py-2 px-5 rounded-full max-w-fit mx-auto shadow-inner">
            <span>👁️ {t("chapter.views", { count: chapter.views ?? 0 })}</span>
            <span className="text-[#c9a557]">•</span>
            <span>📖 {t("chapter.words", { count: wordCount.toLocaleString("tr-TR") })}</span>
            <span className="text-[#c9a557]">•</span>
            <span>⏱️ {t("chapter.readingTime", { count: readingTime })}</span>
            {currentIndex >= 0 && (
              <>
                <span className="text-[#c9a557]">•</span>
                <span>{t("chapter.chapterOf", { current: currentIndex + 1, total: allChapters.length })}</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white backdrop-blur-md border border-[#e5e7dd] rounded-lg p-8 mb-8">
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
              <Link href={`/book/${bookId}/${prevChapter._id}`} className="px-6 py-3 bg-[#eef0e9] border border-[#dce1d4] rounded-lg text-[#343831] hover:bg-[#cfd9c5] transition-all">
                {t("chapter.prev")}
              </Link>
            ) : <div />}
          </div>
          <div>
            {nextChapter ? (
              <Link href={`/book/${bookId}/${nextChapter._id}`} className="px-6 py-3 bg-[#eef0e9] border border-[#dce1d4] rounded-lg text-[#343831] hover:bg-[#cfd9c5] transition-all">
                {t("chapter.next")}
              </Link>
            ) : <div />}
          </div>
        </div>

        {allChapters.length > 0 && (
          <div className="mt-8 pt-8 border-t border-[#e5e7dd]">
            <h3 className="text-2xl font-bold text-[#343831] mb-6 font-title text-center">{t("chapter.allChapters")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allChapters.map((ch, index) => (
                <Link
                  key={ch._id}
                  href={`/book/${bookId}/${ch._id}`}
                  className={`group bg-[#f6f7f2] border rounded-lg p-4 hover:bg-[#f4f7f0] hover:border-[#c3cdb5] transition-all ${ch._id === chapterId ? "border-[#3f5e4b] bg-[#eef3ec]" : "border-[#e5e7dd]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#8b9681] font-text">{t("chapter.chapterLabel", { n: index + 1 })}</span>
                    {ch._id === chapterId && <span className="text-xs text-[#4b6a56] font-text">{t("chapter.current")}</span>}
                  </div>
                  <h4 className="text-base font-semibold text-[#343831] group-hover:text-[#35533f] transition-colors font-title">{ch.title}</h4>
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

"use client";
import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import LoreContent from "@/components/LoreContent";
import CommentSection from "@/components/CommentSection";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const countWords = (text: string) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export default function ChapterDetailPage({ params }: { params: Promise<{ bookId: string; chapterId: string }> }) {
  const { bookId: bookIdRaw, chapterId: chapterIdRaw } = use(params);
  const bookId = bookIdRaw as Id<"books">;
  const chapterId = chapterIdRaw as Id<"chapters">;

  const [lang, setLang] = useState<"tr" | "en">("tr");

  const chapter = useQuery(api.chapters.getById, { id: chapterId });
  const book = useQuery(api.books.getById, { id: bookId });
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (chapter === null || book === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 font-title">Chapter Not Found</h1>
            <Link href={`/book/${bookId}`} className="text-blue-400 hover:text-blue-300">Back to Book</Link>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href={`/book/${bookId}`} className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Book
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-title">{chapter.title}</h1>
          <p className="text-xl text-gray-400 font-text mb-2">{book.title}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-450 font-text mt-3 bg-white/5 border border-white/5 py-1.5 px-4 rounded-full max-w-fit mx-auto">
            <span>👁️ {chapter.views ?? 0} Görüntülenme</span>
            <span className="text-gray-655">•</span>
            <span>📖 {wordCount.toLocaleString("tr-TR")} Kelime</span>
            <span className="text-gray-655">•</span>
            <span>⏱️ {readingTime} dk okuma (80 kelime/dk)</span>
            {currentIndex >= 0 && (
              <>
                <span className="text-gray-655">•</span>
                <span>Bölüm {currentIndex + 1} / {allChapters.length}</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 mb-8">
          <LoreContent content={{ tr: chapter.contentTr, en: chapter.contentEn }} lang={lang} onLangChange={setLang} />
        </div>

        <div className="flex justify-between items-center mb-12">
          <div>
            {prevChapter ? (
              <Link href={`/book/${bookId}/${prevChapter._id}`} className="px-6 py-3 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all">
                ← Previous Chapter
              </Link>
            ) : <div />}
          </div>
          <div>
            {nextChapter ? (
              <Link href={`/book/${bookId}/${nextChapter._id}`} className="px-6 py-3 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all">
                Next Chapter →
              </Link>
            ) : <div />}
          </div>
        </div>

        <CommentSection
          targetId={chapterId}
          initialLikeCount={chapter.likeCount ?? 0}
          viewsCount={chapter.views ?? 0}
        />

        {allChapters.length > 0 && (
          <div className="mt-8 pt-8 border-t border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 font-title text-center">All Chapters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allChapters.map((ch, index) => (
                <Link
                  key={ch._id}
                  href={`/book/${bookId}/${ch._id}`}
                  className={`group bg-white/5 border rounded-lg p-4 hover:bg-white/10 hover:border-white/20 transition-all ${ch._id === chapterId ? "border-blue-500 bg-blue-500/10" : "border-white/10"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 font-text">Chapter {index + 1}</span>
                    {ch._id === chapterId && <span className="text-xs text-blue-400 font-text">Current</span>}
                  </div>
                  <h4 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors font-title">{ch.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

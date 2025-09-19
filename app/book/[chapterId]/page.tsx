import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../components/Header";
import LoreContent from "../../../components/LoreContent";
import bookData from "../../constants/book/data.json";

interface ChapterDetailProps {
  params: {
    chapterId: string;
  };
}

// Helper function to find chapter by chapter ID
function findChapter(chapterId: string) {
  const book = bookData; // Now it's a single object, not an array
  if (!book) return null;

  const chapter = book.chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;

  return { ...chapter, book };
}

export default function ChapterDetail({ params }: ChapterDetailProps) {
  const chapter = findChapter(params.chapterId);

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 font-title">
              Chapter Not Found
            </h1>
            <p className="text-xl text-gray-300 mb-8 font-text">
              The chapter you're looking for doesn't exist.
            </p>
            <Link
              href="/book"
              className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300"
            >
              Back to Book
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentChapterIndex = chapter.book.chapters.findIndex(
    (c) => c.id === params.chapterId
  );
  const prevChapter =
    currentChapterIndex > 0
      ? chapter.book.chapters[currentChapterIndex - 1]
      : null;
  const nextChapter =
    currentChapterIndex < chapter.book.chapters.length - 1
      ? chapter.book.chapters[currentChapterIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Back Button */}
        <Link
          href="/book"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Book
        </Link>

        {/* Chapter Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-title">
            {chapter.title}
          </h1>
          <p className="text-xl text-gray-400 font-text mb-2">
            {chapter.book.title}
          </p>
          <p className="text-lg text-gray-500 font-text">
            Chapter {currentChapterIndex + 1} of {chapter.book.chapters.length}
          </p>
        </div>

        {/* Chapter Content */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 mb-8">
          <LoreContent content={chapter.content} />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            {prevChapter ? (
              <Link
                href={`/book/${prevChapter.id}`}
                className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300"
              >
                ← Previous Chapter
              </Link>
            ) : (
              <div></div>
            )}
          </div>

          <div className="flex gap-4">
            {nextChapter ? (
              <Link
                href={`/book/${nextChapter.id}`}
                className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300"
              >
                Next Chapter →
              </Link>
            ) : (
              <div></div>
            )}
          </div>
        </div>

        {/* Chapter List */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 font-title text-center">
            All Chapters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapter.book.chapters.map((ch, index) => (
              <Link
                key={ch.id}
                href={`/book/${ch.id}`}
                className={`group bg-white/5 backdrop-blur-md border rounded-lg p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 ${
                  ch.id === params.chapterId
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 font-text">
                    Chapter {index + 1}
                  </span>
                  {ch.id === params.chapterId && (
                    <span className="text-xs text-blue-400 font-text">
                      Current
                    </span>
                  )}
                </div>
                <h4 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors font-title">
                  {ch.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

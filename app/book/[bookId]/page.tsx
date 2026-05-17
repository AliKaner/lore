"use client";
import React, { use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function BookDetailPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId: bookIdRaw } = use(params);
  const bookId = bookIdRaw as Id<"books">;
  const book = useQuery(api.books.getById, { id: bookId });
  const chapters = useQuery(api.chapters.listByBook, { bookId });

  if (book === undefined || chapters === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 font-title">Book Not Found</h1>
            <Link href="/" className="text-blue-400 hover:text-blue-300">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const backHref = book.universe ? `/universe/${book.universeId}` : "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Link href={backHref} className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {book.universe ? `Back to ${book.universe.name}` : "Back to Home"}
        </Link>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <div className="w-48 h-64 bg-gray-700 rounded-lg overflow-hidden">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-5xl">📚</div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-white font-title mb-2">{book.title}</h1>
                {book.universe && <p className="text-gray-400 font-text mb-3">{book.universe.name}</p>}
                {book.description && <p className="text-gray-300 font-text text-lg">{book.description}</p>}
              </div>
              {chapters.length > 0 && (
                <div className="flex gap-4">
                  <Link href={`/book/${bookId}/${chapters[0]._id}`} className="px-6 py-3 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all">
                    Read First Chapter
                  </Link>
                  {chapters.length > 1 && (
                    <Link href={`/book/${bookId}/${chapters[chapters.length - 1]._id}`} className="px-6 py-3 bg-transparent border border-white/50 rounded-lg text-white hover:bg-white/10 transition-all">
                      Read Last Chapter
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 font-title">Chapters</h2>
          {chapters.length === 0 ? (
            <p className="text-gray-500 font-text">No chapters yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter, index) => (
                <Link key={chapter._id} href={`/book/${bookId}/${chapter._id}`} className="group bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 font-text">Chapter {index + 1}</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors font-title">{chapter.title}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

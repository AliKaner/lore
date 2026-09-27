"use client";
import React, { use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/hooks/useLocale";

export default function BookClient({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId: bookIdRaw } = use(params);
  const bookId = bookIdRaw as Id<"books">;
  const { t } = useLocale();
  const book = useQuery(api.books.getById, { id: bookId });
  const chapters = useQuery(api.chapters.listByBook, { bookId });

  if (book === undefined || chapters === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--accent)] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-[var(--ink)]">
            <h1 className="text-4xl font-bold mb-4 font-title">{t("book.notFound")}</h1>
            <Link href="/" className="text-[var(--accent-text)] hover:text-[var(--accent-text-hover)]">{t("book.backHome")}</Link>
          </div>
        </div>
      </div>
    );
  }

  const backHref = book.universe ? `/universe/${book.universeId}` : "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)] flex flex-col">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-16 flex-1 w-full">
        <Link href={backHref} className="inline-flex items-center text-[var(--accent-text)] hover:text-[var(--accent-text-hover)] mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {book.universe ? t("book.backToUniverse", { name: book.universe.name }) : t("book.backHome")}
        </Link>

        <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <div className="w-48 h-64 bg-[var(--border)] rounded-lg overflow-hidden">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--muted-2)] text-5xl">📚</div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-[var(--ink)] font-title mb-2">{book.title}</h1>
                {book.universe && <p className="text-[var(--muted)] font-text mb-2">{book.universe.name}</p>}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-[var(--surface-3)] border border-[var(--border)] px-3 py-1 rounded-md text-sm text-[var(--warning-text)] flex items-center gap-1.5 font-text">
                    #️⃣ {t("book.pages", { count: (book as any).chapterCount ?? 0 })}
                  </span>
                  <span className="bg-[var(--surface-3)] border border-[var(--border)] px-3 py-1 rounded-md text-sm text-[var(--warning-text)] flex items-center gap-1.5 font-text">
                    ⏱️ {t("book.readingTime", { count: (book as any).totalReadingTime ?? 0 })}
                  </span>
                </div>
                {book.description && <p className="text-[var(--ink-soft)] font-text text-lg">{book.description}</p>}
              </div>

              {chapters.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  <Link href={`/book/${bookId}/${chapters[0]._id}`} className="px-6 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all">
                    {t("book.readFirst")}
                  </Link>
                  {chapters.length > 1 && (
                    <Link href={`/book/${bookId}/${chapters[chapters.length - 1]._id}`} className="px-6 py-3 bg-transparent border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all">
                      {t("book.readLast")}
                    </Link>
                  )}
                  <Link href={`/book/${bookId}/pdf`} className="px-6 py-3 bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] rounded-lg hover:bg-[var(--danger-soft)] hover:border-[var(--danger-border)] hover:text-[var(--ink)] transition-all flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t("book.savePdf")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-xl p-8">
          <h2 className="text-2xl font-bold text-[var(--ink)] mb-6 font-title">{t("book.chapters")}</h2>
          {chapters.length === 0 ? (
            <p className="text-[var(--muted-3)] font-text">{t("book.noChapters")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((chapter, index) => (
                <Link key={chapter._id} href={`/book/${bookId}/${chapter._id}`} className="group bg-[var(--surface-3)] border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--muted)] font-text">{t("book.chapterLabel", { n: index + 1 })}</span>
                    <svg className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--ink)] group-hover:text-[var(--accent-text-hover)] transition-colors font-title">{chapter.title}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

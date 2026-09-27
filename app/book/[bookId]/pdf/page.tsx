"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { renderRichText } from "@/components/RichText";

export default function BookPdfPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId: bookIdRaw } = use(params);
  const bookId = bookIdRaw as Id<"books">;

  const [lang, setLang] = useState<"tr" | "en">("tr");

  const book = useQuery(api.books.getById, { id: bookId });
  const chapters = useQuery(api.chapters.listByBook, { bookId });

  if (book === undefined || chapters === undefined) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--accent)] rounded-full animate-spin" />
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center text-[var(--ink)] text-center">
        <h1 className="text-3xl font-bold font-title mb-4">Book Not Found</h1>
        <Link href="/" className="text-[var(--accent-text)] hover:underline">Back to Home</Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] print:bg-white print:text-black">
      {/* Control bar - Hidden in Print */}
      <div className="no-print bg-[var(--surface-3)] backdrop-blur-md border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/book/${bookId}`}
            className="flex items-center text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kitaba Geri Dön
          </Link>

          <div className="flex items-center gap-4">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as "tr" | "en")}
              className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40 cursor-pointer"
            >
              <option value="tr">Türkçe Metin</option>
              <option value="en">English Text</option>
            </select>

            <button
              onClick={handlePrint}
              className="px-5 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] font-semibold text-sm rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h8z" />
              </svg>
              PDF Olarak Kaydet / Yazdır
            </button>
          </div>
        </div>
      </div>

      {/* Book Container */}
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 print:p-0 print:max-w-none print:bg-white print:text-black">
        {/* Style block for print formatting */}
        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background-color: white !important;
              color: black !important;
              font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
            }
            .page-break {
              page-break-before: always !important;
              break-before: page !important;
              height: 0;
              margin: 0;
              border: 0;
            }
            h1, h2, h3 {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
          }
        `}</style>

        {/* 1. COVER PAGE */}
        <div className="min-h-[80vh] flex flex-col justify-between items-center text-center py-12 print:min-h-screen print:justify-center">
          <div className="space-y-4">
            {book.universe && (
              <p className="text-[var(--accent-text)] font-semibold font-text text-lg uppercase tracking-widest print:text-black">
                {book.universe.name} Evreni
              </p>
            )}
            <h1 className="text-5xl md:text-6xl font-extrabold font-title tracking-tight mt-2 print:text-black print:text-4xl">
              {book.title}
            </h1>
            <div className="w-24 h-1 bg-[var(--accent)] mx-auto my-6 print:bg-black" />
          </div>

          <div className="my-8 max-w-sm">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-80 object-cover rounded-lg shadow-2xl print:border print:border-gray-300 print:shadow-none"
              />
            ) : (
              <div className="w-48 h-64 bg-[var(--surface-2)] rounded-lg flex items-center justify-center text-[var(--muted-3)] text-6xl mx-auto print:border print:border-gray-300">
                📚
              </div>
            )}
          </div>

          <div className="max-w-md space-y-2">
            {book.description && (
              <p className="text-[var(--ink-soft)] font-text text-base italic print:text-black">
                {book.description}
              </p>
            )}
            <p className="text-sm text-[var(--muted-3)] font-text pt-4">
              Basım Tarihi: {new Date().toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>

        {/* PAGE BREAK */}
        <hr className="page-break" />

        {/* 2. TABLE OF CONTENTS */}
        <div className="min-h-[85vh] py-16 flex flex-col justify-center print:min-h-screen">
          <h2 className="text-3xl font-bold font-title mb-8 border-b border-[var(--border)] pb-4 print:text-black print:border-gray-300">
            İçindekiler / Table of Contents
          </h2>
          <nav className="space-y-4 max-w-lg">
            {chapters.map((ch, index) => (
              <div key={ch._id} className="flex justify-between items-center text-lg font-text">
                <span className="flex-1 border-b border-dotted border-[var(--border)] mr-2 print:border-gray-300">
                  <span className="font-semibold mr-4">Bölüm {index + 1}:</span>
                  <span className="text-[var(--ink-soft)] print:text-black">{ch.title}</span>
                </span>
                <span className="text-[var(--muted)] font-semibold print:text-black">
                  s. {index + 2}
                </span>
              </div>
            ))}
          </nav>
        </div>

        {/* PAGE BREAK */}
        <hr className="page-break" />

        {/* 3. BOOK CHAPTERS CONTENT */}
        <div className="space-y-12">
          {chapters.map((ch, index) => {
            const content = lang === "tr" ? ch.contentTr : ch.contentEn;
            return (
              <div key={ch._id} className="py-12 print:py-8">
                {/* Each chapter starts on a new page in print */}
                {index > 0 && <hr className="page-break" />}

                <div className="mb-8">
                  <span className="text-[var(--accent-text)] font-semibold font-text text-sm uppercase tracking-wider print:text-black">
                    Bölüm {index + 1}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold font-title mt-2 print:text-black print:text-2xl">
                    {ch.title}
                  </h2>
                  <div className="w-16 h-0.5 bg-[var(--accent)] mt-4 print:bg-black" />
                </div>

                <div className="text-[var(--ink-soft)] leading-relaxed font-text text-lg print:text-black print:text-base print:leading-extra-loose">
                  {renderRichText(content)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

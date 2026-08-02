"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-center">
        <h1 className="text-3xl font-bold font-title mb-4">Book Not Found</h1>
        <Link href="/" className="text-blue-400 hover:underline">Back to Home</Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white print:bg-white print:text-black">
      {/* Control bar - Hidden in Print */}
      <div className="no-print bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/book/${bookId}`}
            className="flex items-center text-gray-300 hover:text-white transition-colors"
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
              className="bg-gray-800 border border-white/20 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/50 cursor-pointer"
            >
              <option value="tr">Türkçe Metin</option>
              <option value="en">English Text</option>
            </select>

            <button
              onClick={handlePrint}
              className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
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
              <p className="text-blue-400 font-semibold font-text text-lg uppercase tracking-widest print:text-gray-650">
                {book.universe.name} Evreni
              </p>
            )}
            <h1 className="text-5xl md:text-6xl font-extrabold font-title tracking-tight mt-2 print:text-black print:text-4xl">
              {book.title}
            </h1>
            <div className="w-24 h-1 bg-blue-500 mx-auto my-6 print:bg-gray-400" />
          </div>

          <div className="my-8 max-w-sm">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-80 object-cover rounded-lg shadow-2xl print:border print:border-gray-200 print:shadow-none"
              />
            ) : (
              <div className="w-48 h-64 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-6xl mx-auto print:border print:border-gray-200">
                📚
              </div>
            )}
          </div>

          <div className="max-w-md space-y-2">
            {book.description && (
              <p className="text-gray-300 font-text text-base italic print:text-gray-650">
                {book.description}
              </p>
            )}
            <p className="text-sm text-gray-500 font-text pt-4">
              Basım Tarihi: {new Date().toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>

        {/* PAGE BREAK */}
        <hr className="page-break" />

        {/* 2. TABLE OF CONTENTS */}
        <div className="min-h-[85vh] py-16 flex flex-col justify-center print:min-h-screen">
          <h2 className="text-3xl font-bold font-title mb-8 border-b border-white/20 pb-4 print:text-black print:border-black/20">
            İçindekiler / Table of Contents
          </h2>
          <nav className="space-y-4 max-w-lg">
            {chapters.map((ch, index) => (
              <div key={ch._id} className="flex justify-between items-center text-lg font-text">
                <span className="flex-1 border-b border-dotted border-white/20 mr-2 print:border-black/20">
                  <span className="font-semibold mr-4">Bölüm {index + 1}:</span>
                  <span className="text-gray-300 print:text-black">{ch.title}</span>
                </span>
                <span className="text-gray-400 font-semibold print:text-black">
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
                  <span className="text-blue-400 font-semibold font-text text-sm uppercase tracking-wider print:text-gray-500">
                    Bölüm {index + 1}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold font-title mt-2 print:text-black print:text-2xl">
                    {ch.title}
                  </h2>
                  <div className="w-16 h-0.5 bg-blue-500/50 mt-4 print:bg-gray-300" />
                </div>

                <div className="text-gray-300 leading-relaxed font-text text-lg print:text-black print:text-base print:leading-extra-loose">
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

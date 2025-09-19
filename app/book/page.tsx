import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import bookData from "../constants/book/data.json";

export default function Book() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-title">
            Book
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-text">
            Explore the epic tale and adventures from the Blutac Kingdom
            universe.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {(() => {
            const book = bookData;
            return (
              <div
                key={book.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8"
              >
                {/* Book Card */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    <div className="relative w-48 h-64 bg-gray-700 rounded-lg overflow-hidden">
                      <Image
                        src={`/book/${book.cover}`}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2 font-title">
                        {book.title}
                      </h2>
                      <p className="text-gray-300 font-text text-lg">
                        {book.description}
                      </p>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href={`/book/${book.chapters[0].id}`}
                        className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300 text-center"
                      >
                        Read First Chapter
                      </Link>
                      <Link
                        href={`/book/${
                          book.chapters[book.chapters.length - 1].id
                        }`}
                        className="px-6 py-3 bg-transparent border border-white/50 rounded-lg text-white font-semibold hover:bg-white/10 transition-all duration-300 text-center"
                      >
                        Read Last Chapter
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Chapters List */}
                <div className="mt-8 pt-8 border-t border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-6 font-title">
                    Chapters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {book.chapters.map((chapter, index) => (
                      <Link
                        key={chapter.id}
                        href={`/book/${chapter.id}`}
                        className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400 font-text">
                            Chapter {index + 1}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors font-title">
                          {chapter.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

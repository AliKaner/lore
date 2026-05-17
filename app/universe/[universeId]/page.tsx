"use client";
import React, { useState, use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const TYPES = ["all", "character", "city", "item", "story", "other"] as const;
type TypeFilter = (typeof TYPES)[number];

const TYPE_LABELS: Record<string, string> = {
  all: "All",
  character: "Characters",
  city: "Cities",
  item: "Items",
  story: "Stories",
  other: "Other",
};

export default function UniversePage({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId: universeIdRaw } = use(params);
  const universeId = universeIdRaw as Id<"universes">;

  const [activeTab, setActiveTab] = useState<"lore" | "books">("lore");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const universe = useQuery(api.universes.getById, { id: universeId });
  const categories = useQuery(api.categories.listByUniverse, { universeId });
  const allEntries = useQuery(api.loreEntries.listByUniverse, { universeId });
  const books = useQuery(api.books.listByUniverse, { universeId });

  const filteredEntries = allEntries?.filter((entry) => {
    const catMatch =
      selectedCategory === "all" || entry.categoryId === selectedCategory;
    const typeMatch = typeFilter === "all" || entry.type === typeFilter;
    return catMatch && typeMatch;
  });

  if (universe === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 font-title">Universe Not Found</h1>
            <Link href="/" className="text-blue-400 hover:text-blue-300">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      {/* Universe Hero */}
      <div className="relative h-64 md:h-80">
        {universe?.imageUrl ? (
          <img src={universe.imageUrl} alt={universe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/50 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-title">
            {universe?.name ?? ""}
          </h1>
          {universe?.description && (
            <p className="text-lg text-gray-300 mt-2 font-text max-w-2xl mx-auto px-4">
              {universe.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/20">
          {(["lore", "books"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-title font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "lore" ? "Lore" : "Books"}
            </button>
          ))}
        </div>

        {/* Lore Tab */}
        {activeTab === "lore" && (
          <div className="flex gap-6">
            {/* Left: Categories */}
            <div className="w-44 flex-shrink-0 space-y-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-text transition-colors ${
                  selectedCategory === "all"
                    ? "bg-white/30 text-white border border-white/50"
                    : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
                }`}
              >
                All Categories
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`relative w-full overflow-hidden rounded-lg text-sm font-text transition-all duration-300 text-left ${
                    selectedCategory === cat._id
                      ? "border-2 border-white/70 shadow-lg shadow-black/50"
                      : "border border-white/20 hover:border-white/40"
                  }`}
                >
                  {cat.imageUrl && (
                    <img
                      src={cat.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div
                    className={`absolute inset-0 transition-colors duration-300 ${
                      cat.imageUrl
                        ? selectedCategory === cat._id
                          ? "bg-black/40"
                          : "bg-black/65 hover:bg-black/50"
                        : selectedCategory === cat._id
                        ? "bg-white/30"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  />
                  <span className="relative px-3 py-2 block text-white drop-shadow font-semibold">
                    {cat.name}
                  </span>
                </button>
              ))}

              {/* Type filters */}
              {(categories?.length ?? 0) > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-1">
                  {TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs font-text transition-colors ${
                        typeFilter === type
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Entries */}
            <div className="flex-1 min-w-0">
              {filteredEntries === undefined && (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {filteredEntries !== undefined && filteredEntries.length === 0 && (
                <p className="text-center text-gray-500 font-text py-16">No entries found.</p>
              )}
              {filteredEntries && filteredEntries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEntries
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((entry) => (
                      <Link
                        key={entry._id}
                        href={`/lore/${entry._id}`}
                        className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/40"
                      >
                        <div className="relative h-40 bg-gray-700">
                          {entry.imageUrl ? (
                            <img
                              src={entry.imageUrl}
                              alt={entry.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">
                              {entry.type === "character" && "👤"}
                              {entry.type === "city" && "🏰"}
                              {entry.type === "item" && "⚔️"}
                              {entry.type === "story" && "📖"}
                              {entry.type === "other" && "✨"}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded capitalize font-text">
                            {entry.type}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors font-title">
                            {entry.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 font-text">
                            {categories?.find((c) => c._id === entry.categoryId)?.name ?? ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Books Tab */}
        {activeTab === "books" && (
          <div>
            {books === undefined && (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {books !== undefined && books.length === 0 && (
              <p className="text-center text-gray-500 font-text py-16">No books in this universe yet.</p>
            )}
            {books && books.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((book) => (
                    <Link
                      key={book._id}
                      href={`/book/${book._id}`}
                      className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="flex-shrink-0 w-24 h-36 bg-gray-700 rounded overflow-hidden">
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-full h-full object-cover transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-3xl">📚</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors font-title mb-2">
                            {book.title}
                          </h3>
                          {book.description && (
                            <p className="text-sm text-gray-400 font-text line-clamp-3">{book.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

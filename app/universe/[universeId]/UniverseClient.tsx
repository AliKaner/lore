"use client";
import React, { useState, use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/hooks/useLocale";

const TYPES = ["all", "character", "city", "item", "story", "other", "location", "faction"] as const;
type TypeFilter = (typeof TYPES)[number];

const TYPE_LABEL_KEYS: Record<TypeFilter, string> = {
  all: "universe.typeAll",
  character: "universe.typeCharacter",
  city: "universe.typeCity",
  item: "universe.typeItem",
  story: "universe.typeStory",
  other: "universe.typeOther",
  location: "universe.typeLocation",
  faction: "universe.typeFaction",
};

export default function UniverseClient({
  params,
}: {
  params: Promise<{ universeId: string }>;
}) {
  const { universeId: universeIdRaw } = use(params);
  const universeId = universeIdRaw as Id<"universes">;
  const { t } = useLocale();

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
      <div className="min-h-screen bg-gradient-to-br from-[#f6f7f1] via-[#f2f4ec] to-[#eef1e6]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-[#343831]">
            <h1 className="text-4xl font-bold mb-4 font-title">{t("universe.notFound")}</h1>
            <Link href="/" className="text-[#4b6a56] hover:text-[#35533f]">{t("universe.backHome")}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f7f1] via-[#f2f4ec] to-[#eef1e6] flex flex-col">
      <Header />

      {/* Universe Hero */}
      <div className="relative h-64 md:h-80">
        {universe?.imageUrl ? (
          <img src={universe.imageUrl} alt={universe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#eef0e9]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f6f7f1] via-black/50 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-[#343831] font-title">
            {universe?.name ?? ""}
          </h1>
          {universe?.description && (
            <p className="text-lg text-[#5c6653] mt-2 font-text max-w-2xl mx-auto px-4">
              {universe.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#e5e7dd]">
          {(["lore", "books"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-title font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "text-[#343831] border-b-2 border-[#3f5e4b]"
                  : "text-[#8b9681] hover:text-[#343831]"
              }`}
            >
              {tab === "lore" ? t("universe.tabLore") : t("universe.tabBooks")}
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
                    ? "bg-[#dfe6d9] text-[#343831] border border-[#c3cdb5]"
                    : "bg-white text-[#5c6653] border border-[#e5e7dd] hover:bg-[#dfe6d9]"
                }`}
              >
                {t("universe.allCategories")}
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`relative w-full overflow-hidden rounded-lg text-sm font-text transition-all duration-300 text-left ${
                    selectedCategory === cat._id
                      ? "border-2 border-[#b3bfa3] shadow-lg shadow-black/50"
                      : "border border-[#e5e7dd] hover:border-[#a1b39a]"
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
                        ? "bg-[#dfe6d9]"
                        : "bg-white hover:bg-[#dfe6d9]"
                    }`}
                  />
                  <span className="relative px-3 py-2 block text-[#343831] drop-shadow font-semibold">
                    {cat.name}
                  </span>
                </button>
              ))}

              {/* Type filters */}
              {(categories?.length ?? 0) > 0 && (
                <div className="pt-3 border-t border-[#e5e7dd] space-y-1">
                  {TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs font-text transition-colors ${
                        typeFilter === type
                          ? "bg-[#3f5e4b] text-[#343831]"
                          : "bg-[#f6f7f2] text-[#8b9681] border border-[#e5e7dd] hover:bg-[#f4f7f0]"
                      }`}
                    >
                      {t(TYPE_LABEL_KEYS[type])}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Entries */}
            <div className="flex-1 min-w-0">
              {filteredEntries === undefined && (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[#dce1d4] border-t-[#3f5e4b] rounded-full animate-spin" />
                </div>
              )}
              {filteredEntries !== undefined && filteredEntries.length === 0 && (
                <p className="text-center text-[#96998e] font-text py-16">{t("universe.noEntries")}</p>
              )}
              {filteredEntries && filteredEntries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEntries
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((entry) => (
                      <Link
                        key={entry._id}
                        href={`/lore/${entry._id}`}
                        className="group bg-white backdrop-blur-md border border-[#e5e7dd] rounded-lg overflow-hidden hover:bg-[#f4f7f0] hover:border-[#b3bfa3] transition-all duration-300 hover:shadow-xl hover:shadow-black/40"
                      >
                        <div className="relative h-40 bg-[#e5e7dd]">
                          {entry.imageUrl ? (
                            <img
                              src={entry.imageUrl}
                              alt={entry.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#7a856f] text-4xl">
                              {entry.type === "character" && "👤"}
                              {entry.type === "city" && "🏰"}
                              {entry.type === "item" && "⚔️"}
                              {entry.type === "story" && "📖"}
                              {entry.type === "other" && "✨"}
                              {entry.type === "location" && "🗺️"}
                              {entry.type === "faction" && "🛡️"}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute top-2 right-2 bg-black/50 text-[#343831] text-xs px-2 py-1 rounded capitalize font-text">
                            {entry.type}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-[#343831] group-hover:text-[#35533f] transition-colors font-title">
                            {entry.name}
                          </h3>
                          <p className="text-xs text-[#8b9681] mt-1 font-text">
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
                <div className="w-8 h-8 border-2 border-[#dce1d4] border-t-[#3f5e4b] rounded-full animate-spin" />
              </div>
            )}
            {books !== undefined && books.length === 0 && (
              <p className="text-center text-[#96998e] font-text py-16">{t("universe.noBooks")}</p>
            )}
            {books && books.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((book) => (
                    <Link
                      key={book._id}
                      href={`/book/${book._id}`}
                      className="group bg-white backdrop-blur-md border border-[#e5e7dd] rounded-xl overflow-hidden hover:bg-[#f4f7f0] hover:border-[#b3bfa3] transition-all duration-300"
                    >
                      <div className="flex gap-4 p-4">
                        <div className="flex-shrink-0 w-24 h-36 bg-[#e5e7dd] rounded overflow-hidden">
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="w-full h-full object-cover transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#7a856f] text-3xl">📚</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-[#343831] group-hover:text-[#35533f] transition-colors font-title mb-1.5">
                            {book.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="bg-[#f6f7f2] border border-[#e5e7dd] px-2.5 py-0.5 rounded-md text-xs text-[#8c7332] flex items-center gap-1 font-text">
                              #️⃣ {t("universe.pages", { count: (book as any).chapterCount ?? 0 })}
                            </span>
                            <span className="bg-[#f6f7f2] border border-[#e5e7dd] px-2.5 py-0.5 rounded-md text-xs text-[#8c7332] flex items-center gap-1 font-text">
                              ⏱️ {t("universe.readingTime", { count: (book as any).totalReadingTime ?? 0 })}
                            </span>
                          </div>
                          {book.description && (
                            <p className="text-sm text-[#8b9681] font-text line-clamp-2">{book.description}</p>
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
      <Footer />
    </div>
  );
}

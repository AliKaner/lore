"use client";
import React, { useState, use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function BoardGamePage({
  params,
}: {
  params: Promise<{ boardGameId: string }>;
}) {
  const { boardGameId: rawId } = use(params);
  const boardGameId = rawId as Id<"boardGames">;

  const [activeTab, setActiveTab] = useState<"rules" | "cards">("cards");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<number | "all">("all");

  const game = useQuery(api.boardGames.getById, { id: boardGameId });
  const cardTypes = useQuery(api.cardTypes.listByBoardGame, { boardGameId });
  const allCards = useQuery(api.cards.listByBoardGame, { boardGameId });

  const selectedType = cardTypes?.find((t) => t._id === selectedTypeId);

  const filteredCards = allCards?.filter((c) => {
    const typeMatch = selectedTypeId === "all" || c.cardTypeId === selectedTypeId;
    const levelMatch = selectedLevel === "all" || c.level === selectedLevel;
    return typeMatch && levelMatch;
  });

  const levelOptions =
    selectedType
      ? Array.from({ length: selectedType.levelCount }, (_, i) => i + 1)
      : [];

  if (game === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 font-title">Game Not Found</h1>
            <Link href="/" className="text-blue-400 hover:text-blue-300">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      {/* Hero */}
      <div className="relative h-64 md:h-80">
        {game?.coverUrl ? (
          <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-6xl">🎲</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-black/50 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-title">
            {game?.title ?? ""}
          </h1>
          {game && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="bg-white/20 backdrop-blur border border-white/30 px-3 py-1 rounded-full text-sm text-white font-text">
                {game.minPlayers === game.maxPlayers
                  ? `${game.minPlayers} oyuncu`
                  : `${game.minPlayers}–${game.maxPlayers} oyuncu`}
              </span>
              {game.universe && (
                <Link
                  href={`/universe/${game.universe._id}`}
                  className="bg-white/20 backdrop-blur border border-white/30 px-3 py-1 rounded-full text-sm text-blue-300 hover:text-blue-200 font-text transition-colors"
                >
                  {game.universe.name}
                </Link>
              )}
            </div>
          )}
          {game?.description && (
            <p className="text-gray-300 mt-2 font-text max-w-2xl mx-auto">{game.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/20">
          {(["cards", "rules"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-title font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "cards" ? "Kartlar" : "Kurallar"}
            </button>
          ))}
        </div>

        {/* Cards Tab */}
        {activeTab === "cards" && (
          <div className="flex gap-6">
            {/* Left: Type filters */}
            <div className="w-44 flex-shrink-0 space-y-2">
              <button
                onClick={() => { setSelectedTypeId("all"); setSelectedLevel("all"); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-text transition-colors ${
                  selectedTypeId === "all"
                    ? "bg-white/30 text-white border border-white/50"
                    : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
                }`}
              >
                Tüm Kartlar
              </button>
              {cardTypes?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((type) => (
                <button
                  key={type._id}
                  onClick={() => { setSelectedTypeId(type._id); setSelectedLevel("all"); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-text transition-colors ${
                    selectedTypeId === type._id
                      ? "bg-white/30 text-white border border-white/50"
                      : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
                  }`}
                >
                  <span className="block font-semibold">{type.name}</span>
                  <span className="block text-xs text-gray-400">{type.levelCount} seviye</span>
                </button>
              ))}

              {/* Level filter (only when a type is selected) */}
              {selectedType && levelOptions.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-1">
                  <p className="text-xs text-gray-500 px-1 font-text mb-1">Seviye</p>
                  <button
                    onClick={() => setSelectedLevel("all")}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs font-text transition-colors ${
                      selectedLevel === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Tümü
                  </button>
                  {levelOptions.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs font-text transition-colors ${
                        selectedLevel === lvl
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      Seviye {lvl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Cards grid */}
            <div className="flex-1 min-w-0">
              {filteredCards === undefined && (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {filteredCards !== undefined && filteredCards.length === 0 && (
                <p className="text-center text-gray-500 font-text py-16">Kart bulunamadı.</p>
              )}
              {filteredCards && filteredCards.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredCards
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((card) => {
                      const type = cardTypes?.find((t) => t._id === card.cardTypeId);
                      return (
                        <div
                          key={card._id}
                          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-black/40"
                        >
                          <div className="relative aspect-[2/3] bg-gray-800">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                                🃏
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <span className="absolute top-2 right-2 bg-black/60 text-yellow-300 text-xs px-2 py-0.5 rounded-full font-text font-semibold">
                              Sv.{card.level}
                            </span>
                            {type && (
                              <span className="absolute top-2 left-2 bg-black/60 text-white/80 text-xs px-2 py-0.5 rounded-full font-text">
                                {type.name}
                              </span>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-semibold text-white font-title leading-tight">
                              {card.name}
                            </h3>
                            {card.descriptionTr && (
                              <p className="text-xs text-gray-400 mt-1 font-text line-clamp-2">
                                {card.descriptionTr}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === "rules" && (
          <div className="max-w-3xl">
            {!game?.rulesTr && !game?.rulesEn ? (
              <p className="text-gray-500 font-text text-center py-16">Henüz kural eklenmedi.</p>
            ) : (
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                <div className="prose prose-invert max-w-none font-text text-gray-200 whitespace-pre-wrap">
                  {game.rulesTr || game.rulesEn}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

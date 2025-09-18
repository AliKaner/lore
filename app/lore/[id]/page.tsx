import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../components/Header";
import loreData from "../../constants/lore/data.json";

interface LoreDetailProps {
  params: {
    id: string;
  };
}

// Helper function to find lore by ID
function findLoreById(id: string) {
  for (const category of loreData) {
    const lore = category.lores.find((lore) => lore.id === id);
    if (lore) {
      return { ...lore, category: category.title };
    }
  }
  return null;
}

export default function LoreDetail({ params }: LoreDetailProps) {
  const lore = findLoreById(params.id);

  if (!lore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4 font-title">
              Lore Not Found
            </h1>
            <p className="text-xl text-gray-300 mb-8 font-text">
              The lore entry you're looking for doesn't exist.
            </p>
            <Link
              href="/lore"
              className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300"
            >
              Back to Lore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Back Button */}
        <Link
          href="/lore"
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
          Back to Lore
        </Link>

        {/* Lore Content - Left Content, Right Image Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-title">
                {lore.name}
              </h1>
              <p className="text-lg text-gray-400 font-text">
                Category: {lore.category}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-line font-text text-lg">
                  {lore.content}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="relative">
            <div className="relative h-96 lg:h-[500px] bg-gray-700 rounded-lg overflow-hidden">
              <Image
                src={`/lore/${lore.image}.png`}
                alt={lore.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <Link
            href="/lore"
            className="px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300"
          >
            All Lore
          </Link>
          <button className="px-6 py-3 bg-transparent border border-white/50 rounded-lg text-white font-semibold hover:bg-white/10 transition-all duration-300">
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

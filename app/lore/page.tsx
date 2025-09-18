import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../../components/Header";
import loreData from "../constants/lore/data.json";

export default function Lore() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-title">
            Explore the Lore
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-text">
            Dive deep into the rich tapestry of stories, characters, and worlds
            that make up our universe. Each entry contains detailed lore and
            artwork.
          </p>
        </div>

        <div className="space-y-16">
          {loreData.map((category) => (
            <div key={category.id} className="space-y-8">
              {/* Category Title */}
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-title">
                  {category.title}
                </h2>
              </div>

              {/* Lore Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {category.lores.map((lore) => (
                  <Link
                    key={lore.id}
                    href={`/lore/${lore.id}`}
                    className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="relative h-48 bg-gray-700">
                      <Image
                        src={`/lore/${lore.image}.png`}
                        alt={lore.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>

                    <div className="p-4 text-center">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors font-title">
                        {lore.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-400 mb-6 font-text">
            Discover more stories and expand your knowledge of our world
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const universes = useQuery(api.universes.list);

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0">
        <Image
          src="/landing-bg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10">
        <Header />

        <main className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-title">
              Choose Your Universe
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-text">
              Discover the rich lore and stories that shape our universes
            </p>
          </div>

          {universes !== undefined && universes.length === 0 && null}

          {universes && universes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {universes
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((universe) => (
                  <Link
                    key={universe._id}
                    href={`/universe/${universe._id}`}
                    className="group block"
                  >
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                      <div className="relative h-56 bg-gray-800">
                        {universe.imageUrl ? (
                          <img
                            src={universe.imageUrl}
                            alt={universe.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <svg
                              className="w-16 h-16"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h2 className="text-2xl font-bold text-white font-title">
                            {universe.name}
                          </h2>
                        </div>
                      </div>
                      {universe.description && (
                        <div className="p-4">
                          <p className="text-gray-300 font-text text-sm line-clamp-2">
                            {universe.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

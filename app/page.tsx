import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/landing-bg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header with Logo and Navigation */}
        <Header />

        {/* Main Content */}
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent font-title">
              Welcome to Our World
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 font-text">
              Discover the rich lore and stories that shape our universe
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/lore"
                className="px-8 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300 text-center"
              >
                Explore Lore
              </Link>
              <Link
                href="/lore"
                className="px-8 py-3 bg-transparent border border-white/50 rounded-lg text-white font-semibold hover:bg-white/10 transition-all duration-300 text-center"
              >
                Learn More
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

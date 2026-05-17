"use client";
import Link from "next/link";
import Header from "@/components/Header";

export default function UniverseError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center text-white max-w-md px-4">
          <h1 className="text-4xl font-bold mb-4 font-title">Something went wrong</h1>
          <p className="text-gray-400 font-text mb-8">{error.message}</p>
          <Link href="/" className="px-6 py-3 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

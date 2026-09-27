"use client";
import Link from "next/link";
import Header from "@/components/Header";

export default function UniverseError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-2)] via-[var(--bg)] to-[var(--bg-3)]">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center text-[var(--ink)] max-w-md px-4">
          <h1 className="text-4xl font-bold mb-4 font-title">Something went wrong</h1>
          <p className="text-[var(--muted)] font-text mb-8">{error.message}</p>
          <Link href="/" className="px-6 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import Header from "@/components/Header";

export default function UniverseError({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f7f1] via-[#f2f4ec] to-[#eef1e6]">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center text-[#343831] max-w-md px-4">
          <h1 className="text-4xl font-bold mb-4 font-title">Something went wrong</h1>
          <p className="text-[#8b9681] font-text mb-8">{error.message}</p>
          <Link href="/" className="px-6 py-3 bg-[#eef0e9] border border-[#dce1d4] rounded-lg text-[#343831] hover:bg-[#dfe6d9] transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

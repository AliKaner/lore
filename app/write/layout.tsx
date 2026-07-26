"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWriterAuth } from "@/hooks/useWriterAuth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const NAV = [
  { label: "Panelim", href: "/write" },
  { label: "Yeni Lore Girdisi", href: "/write/lore/new" },
  { label: "Yeni Bölüm", href: "/write/chapters/new" },
];

export default function WriteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, logout, loaded } = useWriterAuth();
  const logoutMutation = useMutation(api.writerAuth.logout);

  useEffect(() => {
    if (loaded && !token && pathname !== "/write/login") {
      router.replace("/write/login");
    }
  }, [loaded, token, pathname, router]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (pathname === "/write/login") return <>{children}</>;
  if (!token) return null;

  const handleLogout = async () => {
    try {
      await logoutMutation({ token });
    } catch {}
    logout();
    router.push("/write/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="border-b border-white/10 bg-black/30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-text transition-colors ${
                  pathname === item.href
                    ? "bg-white/20 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm font-text text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Siteye Git
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-sm font-text text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-4 py-10">{children}</main>
    </div>
  );
}

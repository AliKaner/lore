"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Universes", href: "/admin/universes" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Lore Entries", href: "/admin/entries" },
  { label: "Books", href: "/admin/books" },
  { label: "Chapters", href: "/admin/chapters" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, logout, loaded } = useAdminAuth();
  const logoutAction = useAction(api.admin.logoutPublic);

  useEffect(() => {
    if (loaded && !token && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [loaded, token, pathname, router]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (!token) return null;

  const handleLogout = async () => {
    try {
      await logoutAction({ token });
    } catch {}
    logout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-black/30 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="text-white font-title font-bold text-lg">
            Lore Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-text transition-colors ${
                pathname === item.href
                  ? "bg-white/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-text text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}

"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const SECTIONS = [
  { label: "Universes", href: "/admin/universes", icon: "🌌", query: "universes" },
  { label: "Categories", href: "/admin/categories", icon: "📂", query: "categories" },
  { label: "Lore Entries", href: "/admin/entries", icon: "📜", query: "entries" },
  { label: "Books", href: "/admin/books", icon: "📚", query: "books" },
  { label: "Chapters", href: "/admin/chapters", icon: "📖", query: "chapters" },
  { label: "Writer Requests", href: "/admin/requests", icon: "✍️", query: "requests" },
];

export default function AdminDashboard() {
  const { token } = useAdminAuth();

  const universes = useQuery(api.universes.list);
  const categories = useQuery(api.categories.list);
  const entries = useQuery(api.loreEntries.list);
  const books = useQuery(api.books.list);
  const chapters = useQuery(api.chapters.list);
  const requests = useQuery(
    api.writerRequests.list,
    token ? { sessionToken: token } : "skip"
  );

  const counts: Record<string, number | undefined> = {
    universes: universes?.length,
    categories: categories?.length,
    entries: entries?.length,
    books: books?.length,
    chapters: chapters?.length,
    requests: requests?.length,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8 font-title">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <div className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 hover:border-white/30 transition-all text-center">
              <div className="text-4xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white mb-1 font-title">
                {counts[s.query] ?? "—"}
              </div>
              <div className="text-sm text-gray-400 font-text">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <div className="bg-white/10 border border-white/20 rounded-xl p-5 hover:bg-white/15 hover:border-white/30 transition-all flex items-center gap-4">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <p className="text-white font-semibold font-title">
                  Manage {s.label}
                </p>
                <p className="text-gray-400 text-sm font-text">
                  Add, edit, delete {s.label.toLowerCase()}
                </p>
              </div>
            </div>
          </Link>
        ))}
        <Link href="/">
          <div className="bg-white/10 border border-white/20 rounded-xl p-5 hover:bg-white/15 hover:border-white/30 transition-all flex items-center gap-4">
            <span className="text-3xl">🏠</span>
            <div>
              <p className="text-white font-semibold font-title">View Site</p>
              <p className="text-gray-400 text-sm font-text">
                Open the public site
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

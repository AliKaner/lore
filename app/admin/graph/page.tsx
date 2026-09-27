"use client";
import React from "react";
import { GraphExplorer } from "@/components/graph/GraphExplorer";

export default function AdminGraphPage() {
  return (
    <div className="flex flex-col h-[85vh]">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-[var(--ink)] font-title">Graph</h1>
        <p className="text-[var(--muted)] text-sm font-text mt-1">
          Bir evren seç — bölüm/karakter/lore ağını gösterir. Bir düğüme tıklayınca ilgili
          düzenleyiciye gider. Her yerden{" "}
          <kbd className="px-1.5 py-0.5 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded text-xs">
            Ctrl/Cmd+G
          </kbd>{" "}
          ile de açabilirsin.
        </p>
      </div>
      <GraphExplorer className="flex-1 min-h-0" />
    </div>
  );
}

"use client";
import React from "react";
import { GraphExplorer } from "@/components/graph/GraphExplorer";

export default function AdminGraphPage() {
  return (
    <div className="flex flex-col h-[85vh]">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-white font-title">Graph</h1>
        <p className="text-gray-400 text-sm font-text mt-1">
          Bir evren seç — bölüm/karakter/lore ağını gösterir. Bir düğüme tıklayınca ilgili
          düzenleyiciye gider. Her yerden{" "}
          <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-xs">
            Ctrl/Cmd+G
          </kbd>{" "}
          ile de açabilirsin.
        </p>
      </div>
      <GraphExplorer className="flex-1 min-h-0" />
    </div>
  );
}

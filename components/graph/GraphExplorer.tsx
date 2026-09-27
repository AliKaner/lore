"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GraphView } from "./GraphView";
import { GraphNodeData } from "@/lib/graph/types";

const LAST_UNIVERSE_KEY = "admin_graph_last_universe";

interface GraphExplorerProps {
  onClose?: () => void;
  className?: string;
}

export function GraphExplorer({ onClose, className = "" }: GraphExplorerProps) {
  const router = useRouter();
  const universes = useQuery(api.universes.list, {});
  const [universeId, setUniverseId] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(LAST_UNIVERSE_KEY);
    if (saved) setUniverseId(saved);
  }, []);

  const handleUniverseChange = (id: string) => {
    setUniverseId(id);
    localStorage.setItem(LAST_UNIVERSE_KEY, id);
  };

  const graph = useQuery(
    api.graph.getUniverseGraph,
    universeId ? { universeId: universeId as Id<"universes"> } : "skip"
  );

  const handleNodeClick = (node: GraphNodeData) => {
    const href =
      node.type === "chapter"
        ? `/admin/books/${node.bookId}/write`
        : `/admin/entries?edit=${node.id}`;
    onClose?.();
    router.push(href);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-3 flex-shrink-0">
        <select
          value={universeId}
          onChange={(e) => handleUniverseChange(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--ink)] text-sm focus:outline-none"
        >
          <option value="">Evren seçin</option>
          {universes?.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg text-sm text-[var(--ink)] hover:bg-[var(--surface-hover)] transition-colors font-text"
          >
            Kapat (Esc)
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl overflow-hidden">
        {!universeId ? (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted-3)] font-text">
            Devam etmek için bir evren seç.
          </div>
        ) : graph === undefined ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        ) : (
          <GraphView
            nodes={graph.nodes as GraphNodeData[]}
            edges={graph.edges}
            onNodeClick={handleNodeClick}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
}

export type GraphNodeType = "chapter" | "character" | "location" | "lore" | "faction";

export interface GraphNodeData extends Record<string, unknown> {
  id: string;
  type: GraphNodeType;
  label: string;
  subtitle?: string;
  imageUrl?: string | null;
  /** Only set on chapter nodes — needed to build editor/reader links. */
  bookId?: string;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  linkType: string;
}

export const NODE_STYLE: Record<GraphNodeType, { emoji: string; color: string; ring: string }> = {
  chapter: { emoji: "📖", color: "bg-blue-500/20 border-blue-400/50 text-blue-100", ring: "ring-blue-400/40" },
  character: { emoji: "👤", color: "bg-green-500/20 border-green-400/50 text-green-100", ring: "ring-green-400/40" },
  location: { emoji: "🏰", color: "bg-amber-500/20 border-amber-400/50 text-amber-100", ring: "ring-amber-400/40" },
  lore: { emoji: "✨", color: "bg-purple-500/20 border-purple-400/50 text-purple-100", ring: "ring-purple-400/40" },
  faction: { emoji: "🛡️", color: "bg-red-500/20 border-red-400/50 text-red-100", ring: "ring-red-400/40" },
};

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
  chapter: { emoji: "📖", color: "bg-[#e7eef7] border-[#a9c2de] text-[#2f4d73]", ring: "ring-[#a9c2de]" },
  character: { emoji: "👤", color: "bg-[#e9eee4] border-[#b7cbb0] text-[#3f5e4b]", ring: "ring-[#b7cbb0]" },
  location: { emoji: "🏰", color: "bg-[#f8f1de] border-[#e3d3a6] text-[#8c7332]", ring: "ring-[#e3d3a6]" },
  lore: { emoji: "✨", color: "bg-[#efe9f3] border-[#d4c3dc] text-[#6b4d78]", ring: "ring-[#d4c3dc]" },
  faction: { emoji: "🛡️", color: "bg-[#f7ece9] border-[#e6cfc7] text-[#996a60]", ring: "ring-[#e6cfc7]" },
};

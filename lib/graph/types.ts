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
  chapter: { emoji: "📖", color: "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent-text)]", ring: "ring-[var(--accent)]" },
  character: { emoji: "👤", color: "bg-[var(--accent2-soft)] border-[var(--accent2)] text-[var(--accent2-text)]", ring: "ring-[var(--accent2)]" },
  location: { emoji: "🏰", color: "bg-[var(--danger-soft)] border-[var(--danger-border)] text-[var(--danger)]", ring: "ring-[var(--danger)]" },
  lore: { emoji: "✨", color: "bg-[#2a1a40] border-[#7d5aa3] text-[#c4a8e0]", ring: "ring-[#7d5aa3]" },
  faction: { emoji: "🛡️", color: "bg-[var(--warning-soft)] border-[var(--warning-border)] text-[var(--warning-text)]", ring: "ring-[var(--warning-border)]" },
};

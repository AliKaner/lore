"use client";

import Link from "next/link";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Chapter = Doc<"chapters">;

const COL_WIDTH = 220;
const ROW_HEIGHT = 64;
const NODE_WIDTH = 188;
const NODE_HEIGHT = 48;

type LaidOutNode = { chapter: Chapter; depth: number; y: number };

function layoutTree(chapters: Chapter[]) {
  const childrenMap = new Map<string, Chapter[]>();
  for (const chapter of chapters) {
    const key = chapter.parentChapterId ?? "root";
    const list = childrenMap.get(key) ?? [];
    list.push(chapter);
    childrenMap.set(key, list.sort((a, b) => a.order - b.order));
  }
  const roots = childrenMap.get("root") ?? [];

  const nodes: LaidOutNode[] = [];
  const edges: { from: LaidOutNode; to: LaidOutNode }[] = [];
  let nextRow = 0;
  let maxDepth = 0;

  function build(chapter: Chapter, depth: number): LaidOutNode {
    maxDepth = Math.max(maxDepth, depth);
    const childChapters = childrenMap.get(chapter._id) ?? [];
    if (childChapters.length === 0) {
      const node: LaidOutNode = { chapter, depth, y: nextRow * ROW_HEIGHT + ROW_HEIGHT / 2 };
      nextRow += 1;
      nodes.push(node);
      return node;
    }
    const childNodes = childChapters.map((c) => build(c, depth + 1));
    const y = childNodes.reduce((sum, n) => sum + n.y, 0) / childNodes.length;
    const node: LaidOutNode = { chapter, depth, y };
    nodes.push(node);
    for (const child of childNodes) edges.push({ from: node, to: child });
    return node;
  }

  for (const root of roots) build(root, 0);

  const width = (maxDepth + 1) * COL_WIDTH;
  const height = Math.max(nextRow * ROW_HEIGHT, ROW_HEIGHT);
  return { nodes, edges, width, height, isEmpty: roots.length === 0 };
}

function NodeCard({
  node,
  bookId,
}: {
  node: LaidOutNode;
  bookId: Id<"books">;
}) {
  const { chapter, depth, y } = node;
  return (
    <Link
      href={`/kitap/${bookId}/bolum/${chapter._id}`}
      className="absolute flex flex-col justify-center rounded-lg border bg-surface px-3 py-2 text-sm leading-tight hover:border-border-hover"
      style={{
        left: depth * COL_WIDTH,
        top: y - NODE_HEIGHT / 2,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        borderColor: chapter.isCanonical ? "var(--accent)" : "var(--border)",
      }}
    >
      <span className="truncate font-medium">{chapter.title || "(başlıksız bölüm)"}</span>
      {(chapter.isCanonical || chapter.status === "draft") && (
        <span className="text-xs text-muted">
          {chapter.isCanonical ? "ana hat" : "taslak"}
        </span>
      )}
    </Link>
  );
}

export default function ChapterTree({
  chapters,
  bookId,
}: {
  chapters: Chapter[];
  bookId: Id<"books">;
}) {
  const { nodes, edges, width, height, isEmpty } = layoutTree(chapters);

  if (isEmpty) {
    return <p className="text-muted text-sm">Henüz bölüm yok.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border p-4">
      <div className="relative" style={{ width, height }}>
        <svg
          className="absolute inset-0"
          width={width}
          height={height}
          style={{ overflow: "visible" }}
        >
          {edges.map(({ from, to }) => {
            const x1 = from.depth * COL_WIDTH + NODE_WIDTH;
            const y1 = from.y;
            const x2 = to.depth * COL_WIDTH;
            const y2 = to.y;
            const midX = (x1 + x2) / 2;
            return (
              <path
                key={`${from.chapter._id}-${to.chapter._id}`}
                d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
                fill="none"
                stroke="var(--border-hover)"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
        {nodes.map((node) => (
          <NodeCard key={node.chapter._id} node={node} bookId={bookId} />
        ))}
      </div>
    </div>
  );
}

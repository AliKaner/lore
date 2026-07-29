import dagre from "@dagrejs/dagre";
import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "@/components/graph/GraphNode";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;

/** Git-tree style layout: chapters flow top-to-bottom by branch, everything else falls in around them. */
export function getDagreLayout(
  nodes: FlowGraphNode[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): FlowGraphNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 90 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    if (!pos) return n;
    return {
      ...n,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";
import type { Edge } from "@xyflow/react";
import type { FlowGraphNode } from "@/components/graph/GraphNode";

interface SimNode extends SimulationNodeDatum {
  id: string;
}

/** Force-directed "web" layout for the broader character/lore/location/faction graph. */
export function getForceLayout(
  nodes: FlowGraphNode[],
  edges: Edge[],
  width = 1000,
  height = 700
): FlowGraphNode[] {
  const simNodes: SimNode[] = nodes.map((n, i) => ({
    id: n.id,
    x: width / 2 + Math.cos(i) * 200,
    y: height / 2 + Math.sin(i) * 200,
  }));
  const simLinks = edges.map((e) => ({ source: e.source, target: e.target }));

  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(140)
    )
    .force("charge", forceManyBody().strength(-350))
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(70))
    .stop();

  for (let i = 0; i < 300; i++) simulation.tick();

  const posById = new Map(simNodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));

  return nodes.map((n) => ({
    ...n,
    position: posById.get(n.id) ?? { x: 0, y: 0 },
  }));
}

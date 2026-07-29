"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GraphNode, type FlowGraphNode } from "./GraphNode";
import { getDagreLayout } from "@/lib/graph/dagreLayout";
import { getForceLayout } from "@/lib/graph/forceLayout";
import { GraphEdgeData, GraphNodeData } from "@/lib/graph/types";

const nodeTypes = {
  chapter: GraphNode,
  character: GraphNode,
  location: GraphNode,
  lore: GraphNode,
  faction: GraphNode,
};

export type GraphMode = "tree" | "web";

interface GraphViewProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  defaultMode?: GraphMode;
  onNodeClick?: (node: GraphNodeData) => void;
  className?: string;
}

export function GraphView({
  nodes: rawNodes,
  edges: rawEdges,
  defaultMode = "tree",
  onNodeClick,
  className = "",
}: GraphViewProps) {
  const [mode, setMode] = useState<GraphMode>(defaultMode);

  const flowEdges: Edge[] = useMemo(
    () =>
      rawEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.linkType,
        style: { stroke: "rgba(255,255,255,0.25)" },
        labelStyle: { fill: "rgba(255,255,255,0.5)", fontSize: 10 },
      })),
    [rawEdges]
  );

  const positionedNodes: FlowGraphNode[] = useMemo(() => {
    const baseNodes: FlowGraphNode[] = rawNodes.map((n) => ({
      id: n.id,
      type: n.type,
      data: n,
      position: { x: 0, y: 0 },
    }));
    return mode === "tree"
      ? getDagreLayout(baseNodes, flowEdges)
      : getForceLayout(baseNodes, flowEdges);
  }, [rawNodes, flowEdges, mode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(positionedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => setNodes(positionedNodes), [positionedNodes, setNodes]);
  useEffect(() => setEdges(flowEdges), [flowEdges, setEdges]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-3 left-3 z-10 flex gap-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg p-1">
        <button
          onClick={() => setMode("tree")}
          className={`px-3 py-1.5 rounded-md text-xs font-title font-semibold transition-colors ${
            mode === "tree" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          🌳 Git-Tree
        </button>
        <button
          onClick={() => setMode("web")}
          className={`px-3 py-1.5 rounded-md text-xs font-title font-semibold transition-colors ${
            mode === "web" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          🕸️ Web
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick?.(node.data as GraphNodeData)}
        colorMode="dark"
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ffffff20" gap={24} />
        <Controls className="!bg-black/50 !border-white/10" />
        <MiniMap
          className="!bg-black/50"
          maskColor="rgba(0,0,0,0.6)"
          nodeColor={() => "#ffffff40"}
        />
      </ReactFlow>
    </div>
  );
}

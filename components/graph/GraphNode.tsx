"use client";
import React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { GraphNodeData, NODE_STYLE } from "@/lib/graph/types";

export type FlowGraphNode = Node<GraphNodeData>;

export function GraphNode({ data, selected }: NodeProps<FlowGraphNode>) {
  const style = NODE_STYLE[data.type];

  return (
    <div
      className={`px-3 py-2 rounded-lg border backdrop-blur-md shadow-lg min-w-[140px] max-w-[200px] font-text transition-all ${style.color} ${
        selected ? `ring-2 ${style.ring}` : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-white/40 !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-white/40 !border-0 !w-2 !h-2" />
      <div className="flex items-start gap-2">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
        ) : (
          <span className="text-lg flex-shrink-0">{style.emoji}</span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">{data.label}</p>
          {data.subtitle && (
            <p className="text-xs opacity-70 truncate">{data.subtitle}</p>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-white/40 !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-white/40 !border-0 !w-2 !h-2" />
    </div>
  );
}

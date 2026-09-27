"use client";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";

export function WikiLinkNodeView({ node, extension }: NodeViewProps) {
  const onNavigate = extension.options.onNavigate as ((id: string) => void) | undefined;
  return (
    <NodeViewWrapper as="span" className="wiki-link" contentEditable={false}>
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); if (node.attrs.id && onNavigate) onNavigate(node.attrs.id); }}
      >
        ⟦{node.attrs.label}⟧
      </a>
    </NodeViewWrapper>
  );
}

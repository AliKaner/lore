"use client";
import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useRef } from "react";

export function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const wrapRef = useRef<HTMLElement>(null);
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startWidth = wrapRef.current?.getBoundingClientRect().width || node.attrs.width || 300;
    drag.current = { startX: e.clientX, startWidth };
    const onMove = (ev: PointerEvent) => {
      if (!drag.current) return;
      const next = Math.round(Math.max(80, Math.min(1000, drag.current.startWidth + (ev.clientX - drag.current.startX))));
      updateAttributes({ width: next });
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "nwse-resize";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <NodeViewWrapper
      ref={wrapRef as any}
      as="span"
      className={`tiptap-resizable-image${selected ? " is-selected" : ""}`}
      style={node.attrs.width ? { width: `${node.attrs.width}px` } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={node.attrs.src} alt={node.attrs.alt || ""} draggable={false} />
      <span className="tiptap-image-resize-handle" onPointerDown={onPointerDown} contentEditable={false} />
    </NodeViewWrapper>
  );
}

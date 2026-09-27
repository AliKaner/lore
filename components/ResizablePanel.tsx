"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface ResizablePanelProps {
  id: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  children: React.ReactNode;
  className?: string;
}

/** A column with a drag handle on its trailing edge; width persists per `id` in localStorage. */
export function ResizablePanel({ id, defaultWidth, minWidth = 160, maxWidth = 480, children, className = "" }: ResizablePanelProps) {
  const storageKey = `desk-panel-width-${id}`;
  const [width, setWidth] = useState(defaultWidth);
  const dragging = useRef(false);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (saved) setWidth(Math.min(maxWidth, Math.max(minWidth, saved)));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current) return;
    setWidth((w) => w);
    const el = document.getElementById(`panel-${id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = Math.min(maxWidth, Math.max(minWidth, e.clientX - rect.left));
    setWidth(next);
  }, [id, minWidth, maxWidth]);

  const stopDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    setWidth((w) => {
      try { localStorage.setItem(storageKey, String(w)); } catch {}
      return w;
    });
  }, [storageKey]);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
    };
  }, [onPointerMove, stopDrag]);

  return (
    <div id={`panel-${id}`} className={`resizable-panel ${className}`} style={{ width }}>
      <div className="resizable-panel-body">{children}</div>
      <div
        className="resizable-panel-handle"
        onPointerDown={(e) => { e.preventDefault(); dragging.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }}
      />
    </div>
  );
}

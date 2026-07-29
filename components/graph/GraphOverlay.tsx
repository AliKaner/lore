"use client";
import React, { useEffect } from "react";
import { GraphExplorer } from "./GraphExplorer";

interface GraphOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function GraphOverlay({ open, onClose }: GraphOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/98 backdrop-blur-sm p-4 md:p-6 flex flex-col">
      <GraphExplorer onClose={onClose} className="flex-1 min-h-0" />
    </div>
  );
}

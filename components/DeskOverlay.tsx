"use client";
import React, { useEffect } from "react";

interface DeskOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Slides a panel over the desk without unmounting whatever is underneath (the editor stays live). */
export function DeskOverlay({ open, onClose, title, children }: DeskOverlayProps) {
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
    <div className="desk-overlay-backdrop" onClick={onClose}>
      <div className="desk-overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="desk-overlay-head">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Kapat">✕</button>
        </div>
        <div className="desk-overlay-body">{children}</div>
      </div>
    </div>
  );
}

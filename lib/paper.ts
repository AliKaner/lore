"use client";

import { useSyncExternalStore } from "react";

// Paper sizes for the writing screen's page view. Sizes and margins are in
// millimetres, the type in points, roughly as a book or manuscript of that
// size would be set — so one page on screen is one printed page.

export type PaperId = "a5" | "b5" | "a4" | "b4" | "a3" | "b3";

export type Paper = {
  id: PaperId;
  label: string;
  width: number;
  height: number;
  marginX: number;
  marginTop: number;
  marginBottom: number;
  fontPt: number;
  note: string;
};

export const PAPERS: Paper[] = [
  { id: "a5", label: "A5", width: 148, height: 210, marginX: 17, marginTop: 18, marginBottom: 20, fontPt: 10.5, note: "Roman, cep kitabı" },
  { id: "b5", label: "B5", width: 176, height: 250, marginX: 20, marginTop: 20, marginBottom: 22, fontPt: 11, note: "Kitap, dergi" },
  { id: "a4", label: "A4", width: 210, height: 297, marginX: 25, marginTop: 25, marginBottom: 25, fontPt: 12, note: "Dosya, müsvedde" },
  { id: "b4", label: "B4", width: 250, height: 353, marginX: 28, marginTop: 28, marginBottom: 30, fontPt: 13, note: "Büyük boy" },
  { id: "a3", label: "A3", width: 297, height: 420, marginX: 32, marginTop: 32, marginBottom: 34, fontPt: 15, note: "Afiş, büyük baskı" },
  { id: "b3", label: "B3", width: 353, height: 500, marginX: 38, marginTop: 38, marginBottom: 40, fontPt: 17, note: "Poster" },
];

export const MM = 96 / 25.4; // CSS pixels in a millimetre
export const PT = 96 / 72; // CSS pixels in a point

export function paperById(id: string | null): Paper | null {
  return PAPERS.find((p) => p.id === id) ?? null;
}

/* ---------- The writer's choice, remembered on this device ---------- */

const KEY = "booktion:sayfa";
const listeners = new Set<() => void>();

function read(): PaperId | null {
  try {
    return paperById(window.localStorage.getItem(KEY))?.id ?? null;
  } catch {
    return null;
  }
}

export function usePaperChoice() {
  const id = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => null,
  );
  function choose(next: PaperId | null) {
    try {
      if (next) window.localStorage.setItem(KEY, next);
      else window.localStorage.removeItem(KEY);
    } catch {}
    for (const listener of listeners) listener();
  }
  return [paperById(id), choose] as const;
}

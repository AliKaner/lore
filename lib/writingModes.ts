"use client";

import { useSyncExternalStore } from "react";

// How the writing screen behaves while typing, remembered on this device.

export type TypingSound = "none" | "daktilo" | "mekanik" | "tiklama" | "yumusak" | "kalem";

export type WritingModes = {
  // The line being written stays at the same height; the text scrolls up.
  typewriter: boolean;
  // Paragraphs other than the one being written fade back.
  focus: boolean;
  sound: TypingSound;
  volume: number;
};

export const SOUNDS: { id: TypingSound; label: string; hint: string }[] = [
  { id: "none", label: "Sessiz", hint: "Ses yok" },
  { id: "daktilo", label: "Daktilo", hint: "Tok vuruş, satır sonunda zil" },
  { id: "mekanik", label: "Mekanik klavye", hint: "Tok ve yumuşak, kahverengi switch" },
  { id: "tiklama", label: "Tıkırtılı mekanik", hint: "Net tık, mavi switch" },
  { id: "yumusak", label: "Yumuşak tuş", hint: "Membran klavye, kısık" },
  { id: "kalem", label: "Kalem", hint: "Kâğıtta kurşun kalem hışırtısı" },
];

const DEFAULTS: WritingModes = { typewriter: false, focus: false, sound: "none", volume: 0.6 };
const KEY = "booktion:yazma-modu";
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: WritingModes } | null = null;

function read(): WritingModes {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {}
  if (cached && cached.raw === raw) return cached.value;
  let value = DEFAULTS;
  try {
    if (raw) value = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<WritingModes>) };
  } catch {}
  cached = { raw, value };
  return value;
}

export function useWritingModes() {
  const modes = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => DEFAULTS,
  );
  function change(patch: Partial<WritingModes>) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
    } catch {}
    for (const listener of listeners) listener();
  }
  return [modes, change] as const;
}

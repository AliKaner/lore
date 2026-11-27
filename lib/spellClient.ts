"use client";

import type { Lang } from "@/lib/completion";

// One spelling worker per language, shared by every editor on the page.

type Reply = { id: number; ok: boolean; wrong?: string[]; suggestions?: string[]; error?: string };

export type SpellChecker = {
  ready: Promise<boolean>;
  check: (words: string[]) => Promise<string[]>;
  suggest: (word: string) => Promise<string[]>;
  add: (words: string[]) => void;
};

const checkers = new Map<Lang, SpellChecker>();

export function spellChecker(lang: Lang): SpellChecker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  const existing = checkers.get(lang);
  if (existing) return existing;

  const worker = new Worker(new URL("./spell.worker.ts", import.meta.url), { type: "module" });
  let next = 0;
  const waiting = new Map<number, (reply: Reply) => void>();
  worker.onmessage = (event: MessageEvent<Reply>) => {
    waiting.get(event.data.id)?.(event.data);
    waiting.delete(event.data.id);
  };
  const ask = (message: object) =>
    new Promise<Reply>((resolve) => {
      const id = ++next;
      waiting.set(id, resolve);
      worker.postMessage({ ...message, id });
    });

  const ready = ask({ type: "load", lang }).then((reply) => {
    if (!reply.ok) {
      checkers.delete(lang); // try again another time
      worker.terminate();
    }
    return reply.ok;
  });

  const checker: SpellChecker = {
    ready,
    check: async (words) => {
      if (!(await ready)) return [];
      const reply = await ask({ type: "check", words });
      return reply.wrong ?? [];
    },
    suggest: async (word) => {
      if (!(await ready)) return [];
      const reply = await ask({ type: "suggest", word });
      return reply.suggestions ?? [];
    },
    add: (words) => {
      void ready.then((ok) => {
        if (ok) void ask({ type: "add", words });
      });
    },
  };
  checkers.set(lang, checker);
  return checker;
}

// The writer's own dictionary, per language, on this device.
const ownKey = (lang: Lang) => `booktion:sozlugum:${lang}`;

export function ownWords(lang: Lang): string[] {
  try {
    const raw = window.localStorage.getItem(ownKey(lang));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addOwnWord(lang: Lang, word: string) {
  const words = new Set(ownWords(lang));
  words.add(word);
  try {
    window.localStorage.setItem(ownKey(lang), JSON.stringify([...words].slice(-5000)));
  } catch {}
  spellChecker(lang)?.add([word]);
}

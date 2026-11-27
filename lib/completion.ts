// Word completion: the rest of the word being typed, from the writer's own
// words first (their characters' names, words they keep using) and then
// from the writing language's word list (public/words, CC BY-SA 4.0).
// Runs in the browser; nothing the writer types leaves the device.

export type Lang = "tr" | "en";

// Words by their first three letters, most frequent first.
export type WordIndex = Map<string, string[]>;

const MIN_PREFIX = 3;
const MIN_GAIN = 2;
const LETTERS = /^\p{L}+$/u;
const TRAILING_WORD = /\p{L}+$/u;
const WORDS = /\p{L}+/gu;

export const lowerIn = (lang: Lang, text: string) => text.toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-US");
const upperIn = (lang: Lang, text: string) => text.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US");

export function buildIndex(words: string[]): WordIndex {
  const index: WordIndex = new Map();
  for (const word of words) {
    if (word.length < MIN_PREFIX + 1) continue;
    const key = word.slice(0, MIN_PREFIX);
    const bucket = index.get(key);
    if (bucket) bucket.push(word);
    else index.set(key, [word]);
  }
  return index;
}

const loads = new Map<Lang, Promise<WordIndex | null>>();
const ready = new Map<Lang, WordIndex>();

// The language's list, fetched once; null if it couldn't be loaded.
export function loadWords(lang: Lang): Promise<WordIndex | null> {
  let pending = loads.get(lang);
  if (!pending) {
    pending = fetch(`/words/${lang}.txt`)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => {
        const index = buildIndex(text.split("\n").filter(Boolean));
        ready.set(lang, index);
        return index;
      })
      .catch(() => {
        loads.delete(lang); // try again next time
        return null;
      });
    loads.set(lang, pending);
  }
  return pending;
}

export const loadedWords = (lang: Lang) => ready.get(lang) ?? null;

// The writer's own vocabulary: names first, then words of five or more
// letters they've used at least twice, most used first.
export function personalWords(lang: Lang, text: string, names: string[]): string[] {
  const counts = new Map<string, number>();
  for (const match of text.matchAll(WORDS)) {
    const word = match[0];
    if (word.length < 5) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const own = [...counts]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
  const nameWords = names.flatMap((name) => name.split(/\s+/u)).filter((w) => w.length > MIN_PREFIX && LETTERS.test(w));
  const seen = new Set<string>();
  return [...nameWords, ...own].filter((word) => {
    const key = lowerIn(lang, word);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// What to add after the word the text ends with, or null. The typed letters
// keep their case; the rest follows them (all capitals stay capitals).
export function completeWord(
  lang: Lang,
  before: string,
  index: WordIndex | null,
  personal: string[],
): string | null {
  const typed = TRAILING_WORD.exec(before)?.[0];
  if (!typed || typed.length < MIN_PREFIX) return null;
  const prefix = lowerIn(lang, typed);
  const fits = (word: string) =>
    word.length >= typed.length + MIN_GAIN && lowerIn(lang, word).startsWith(prefix);
  const word = personal.find(fits) ?? index?.get(prefix.slice(0, MIN_PREFIX))?.find(fits);
  if (!word) return null;
  const rest = word.slice(typed.length);
  const shouting = typed.length >= 2 && typed === upperIn(lang, typed) && typed !== prefix;
  return shouting ? upperIn(lang, rest) : rest;
}

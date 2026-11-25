// A reader's own reading settings (speed, bionic, name highlighting), kept on
// this device only.

type Prefs = { wpm: number; bionic: boolean; names: boolean };

const KEY = "booktion:okuma";

function load(): Partial<Prefs> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Partial<Prefs>;
  } catch {
    return {};
  }
}

export function readPref<K extends keyof Prefs>(key: K, fallback: Prefs[K]): Prefs[K] {
  const value = load()[key];
  return value === undefined || typeof value !== typeof fallback ? fallback : (value as Prefs[K]);
}

export function writePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...load(), [key]: value }));
  } catch {
    // Private mode or blocked storage: the setting just won't be remembered.
  }
}

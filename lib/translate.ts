import { EN } from "@/lib/i18n/en";
import type { Locale } from "@/lib/locale";

// Shared by server and client components (lib/i18n.tsx wraps it in a hook,
// lib/serverI18n.ts reads the language from the cookie).

// Booktion is written in Turkish; every Turkish string the interface shows
// goes through `t`, which returns it as is in Turkish and its English
// version (lib/i18n/en) in English. `{name}` placeholders are filled from
// `vars`; an English entry can be a function when it needs plurals.

export type Vars = Record<string, string | number>;
export type Entry = string | ((vars: Vars) => string);

function fill(text: string, vars?: Vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/gu, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

// Server errors arrive wrapped ("[CONVEX M(...)] ... Uncaught Error: …").
function bareMessage(text: string) {
  const match = /Uncaught Error: ([^\n]+)/u.exec(text);
  return match ? match[1].trim() : text;
}

export function translate(locale: Locale, text: string, vars?: Vars): string {
  if (locale === "tr") return fill(text, vars);
  const entry = EN[text] ?? EN[bareMessage(text)];
  if (entry === undefined) {
    return fill(bareMessage(text), vars);
  }
  return typeof entry === "function" ? entry(vars ?? {}) : fill(entry, vars);
}

export function intlLocale(locale: Locale) {
  return locale === "en" ? "en-GB" : "tr-TR";
}

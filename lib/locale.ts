// Shared by the server (layout) and the browser.

export type Locale = "tr" | "en";
export const LOCALE_COOKIE = "booktion-dil";

export function isLocale(value: unknown): value is Locale {
  return value === "tr" || value === "en";
}

// The language before anyone chooses one. English, so the site opens the
// same for every visitor; the TR | EN switch is always one click away.
export const DEFAULT_LOCALE: Locale = "en";

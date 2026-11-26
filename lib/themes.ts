import type { ThemeId } from "@/convex/themes";

export type { ThemeId };

export type Theme = {
  id: ThemeId;
  label: string;
  scheme: "light" | "dark" | "system";
  // Page, accent and highlight, for the picker's swatch.
  swatch: [string, string, string];
};

export const THEMES: Theme[] = [
  { id: "booktion", label: "Booktion", scheme: "system", swatch: ["#f4f6fb", "#26428b", "#e3af64"] },
  { id: "cilek", label: "Çilek", scheme: "light", swatch: ["#fbf2f1", "#c8283f", "#4f8a3c"] },
  { id: "kurbaga", label: "Kurbağa", scheme: "light", swatch: ["#f1f6ea", "#3b7a29", "#d9b836"] },
  { id: "at", label: "At", scheme: "light", swatch: ["#f5eee4", "#8a4b22", "#c99a4b"] },
  { id: "gokyuzu", label: "Gökyüzü", scheme: "light", swatch: ["#edf5fc", "#1d6aab", "#f2b544"] },
  { id: "karanlik", label: "Karanlık", scheme: "dark", swatch: ["#0f1939", "#e3af64", "#8fa2e6"] },
  { id: "gul", label: "Gül", scheme: "light", swatch: ["#f8f0f0", "#9a4757", "#66836a"] },
  { id: "ates", label: "Ateş", scheme: "dark", swatch: ["#1a0f0c", "#ff7a2f", "#ffc247"] },
  { id: "pembik", label: "PEMBİK", scheme: "light", swatch: ["#fff0f7", "#c4217c", "#9461dc"] },
];

export const DEFAULT_THEME: ThemeId = "booktion";
export const THEME_STORAGE_KEY = "booktion:tema";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

function systemScheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Puts a theme on <html>: data-theme picks the palette, data-scheme drives
// `dark:` styles. The default theme has no data-theme and follows the system.
export function applyTheme(id: ThemeId, { fade = false } = {}) {
  const root = document.documentElement;
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
  if (fade) {
    root.classList.add("theme-fade");
    window.setTimeout(() => root.classList.remove("theme-fade"), 400);
  }
  if (theme.id === DEFAULT_THEME) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme.id);
  root.setAttribute("data-scheme", theme.scheme === "system" ? systemScheme() : theme.scheme);
}

export function storedTheme(): ThemeId {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(id: ThemeId) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
}

// Runs in <head> before the page paints, so a chosen theme never flashes the
// default one first. Kept in sync with applyTheme by hand.
export const THEME_BOOT_SCRIPT = `(function(){try{var ids=${JSON.stringify(
  Object.fromEntries(THEMES.map((t) => [t.id, t.scheme])),
)};var id=null;try{id=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(!ids[id])id=${JSON.stringify(
  DEFAULT_THEME,
)};var r=document.documentElement;var s=ids[id];if(s==="system")s=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";if(id!==${JSON.stringify(
  DEFAULT_THEME,
)})r.setAttribute("data-theme",id);r.setAttribute("data-scheme",s)}catch(e){}})();`;

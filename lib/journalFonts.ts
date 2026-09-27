export const JOURNAL_FONTS = [
  { name: "Lora", value: "var(--font-lora), Georgia, serif" },
  { name: "Cinzel", value: "var(--font-cinzel), Georgia, serif" },
  { name: "Playfair Display", value: "var(--font-playfair), Georgia, serif" },
  { name: "Caveat", value: "var(--font-caveat), cursive" },
  { name: "Dancing Script", value: "var(--font-dancing), cursive" },
  { name: "Special Elite", value: "var(--font-typewriter), monospace" },
  { name: "Courier Prime", value: "var(--font-mono-journal), monospace" },
  { name: "Kalam", value: "var(--font-kalam), cursive" },
  { name: "Sans", value: "Arial, Helvetica, sans-serif" },
] as const;

export const DEFAULT_JOURNAL_FONT = JOURNAL_FONTS[0].value;

// The public address, for canonical links, the sitemap and social cards.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://booktions.com").replace(/\/$/, "");
export const SITE_NAME = "Booktion";

export const SITE_TEXT = {
  tr: {
    title: "Booktion — Her yazıya kendi masası",
    description:
      "Romanını, köşe yazını, röportajını ya da günlüğünü yaz; her tür kendi şablonuyla gelir. Kurmacada okurların hikâyeni dallandırır.",
  },
  en: {
    title: "Booktion — A desk for every kind of writing",
    description:
      "Write your novel, column, interview or diary; every kind comes with its own template. In fiction, readers branch your story.",
  },
};

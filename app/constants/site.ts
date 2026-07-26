export const SITE_URL = "https://booktions.com";
export const SITE_NAME = "Booktions";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export function excerpt(text: string | undefined | null, maxLength = 160): string {
  if (!text) return "";
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;
  return collapsed.slice(0, maxLength - 1).trimEnd() + "…";
}

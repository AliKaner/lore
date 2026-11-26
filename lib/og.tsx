// Shared look for the social preview cards (WhatsApp, X/Twitter, Telegram,
// LinkedIn…), drawn with next/og at 1200×630.

export const OG_SIZE = { width: 1200, height: 630 };

export const BRAND = {
  ink: "#0f1939",
  paper: "#f6f3e7",
  caramel: "#e3af64",
  sapphire: "#8fa2e6",
  muted: "#a9b1cf",
};

// EB Garamond, subset to just the letters the card uses. Falls back to the
// default font if Google Fonts can't be reached.
export async function garamond(text: string, weight = 500): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=EB+Garamond:wght@${weight}&text=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; og-image)" } },
    ).then((r) => r.text());
    const url = /src: url\((.+?)\) format\('(opentype|truetype)'\)/u.exec(css)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export function Diamond({ size = 18 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: BRAND.caramel,
        transform: "rotate(45deg)",
        marginLeft: size * 0.6,
        marginBottom: size * 0.4,
      }}
    />
  );
}

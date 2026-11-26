import { ImageResponse } from "next/og";
import { BRAND, Diamond, OG_SIZE, garamond } from "@/lib/og";

export const alt = "Booktion — Her yazıya kendi masası";
export const size = OG_SIZE;
export const contentType = "image/png";

const TITLE = "Booktion";
const TAGLINE = "Her yazıya kendi masası";
const SUB = "Roman, öykü, şiir, köşe yazısı, röportaj, günlük — A desk for every kind of writing";

export default async function Image() {
  const font = await garamond(`${TITLE}${TAGLINE}${SUB}`);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background: `radial-gradient(70% 90% at 10% 0%, rgba(227,175,100,0.35), rgba(227,175,100,0) 60%), radial-gradient(80% 100% at 90% 100%, rgba(81,106,200,0.45), rgba(81,106,200,0) 70%), ${BRAND.ink}`,
          color: BRAND.paper,
          fontFamily: font ? "Garamond" : "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: BRAND.caramel, letterSpacing: 6 }}>
          <div style={{ width: 44, height: 2, background: BRAND.caramel }} />
          YAZ · DALLANDIR · OKU
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-end", fontSize: 150, lineHeight: 1, letterSpacing: -2 }}>
            {TITLE}
            <Diamond size={26} />
          </div>
          <div style={{ fontSize: 64, marginTop: 18, color: BRAND.paper }}>{TAGLINE}</div>
        </div>
        <div style={{ fontSize: 30, color: BRAND.muted }}>{SUB}</div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Garamond", data: font, weight: 500, style: "normal" }] : undefined,
    },
  );
}

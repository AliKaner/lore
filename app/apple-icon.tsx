import { ImageResponse } from "next/og";
import { BRAND, garamond } from "@/lib/og";

// The home-screen icon on iPhone and iPad.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const font = await garamond("B", 600);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.ink,
          color: BRAND.paper,
          fontSize: 132,
          fontFamily: font ? "Garamond" : "serif",
          paddingBottom: 8,
        }}
      >
        B
        <div
          style={{
            position: "absolute",
            right: 30,
            bottom: 38,
            width: 16,
            height: 16,
            background: BRAND.caramel,
            transform: "rotate(45deg)",
          }}
        />
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Garamond", data: font, weight: 600, style: "normal" }] : undefined },
  );
}

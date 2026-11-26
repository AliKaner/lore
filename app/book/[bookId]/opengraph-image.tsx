import { ImageResponse } from "next/og";
import { BRAND, Diamond, OG_SIZE, garamond } from "@/lib/og";
import { bookForShare } from "@/lib/shareMeta";

export const alt = "Booktion'da bir yazı";
export const size = OG_SIZE;
export const contentType = "image/png";

// The card a shared writing (and its chapters) shows: title, kind, author.
export default async function Image({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = await bookForShare(bookId);
  const title = book?.title ?? "Booktion";
  const kind = book?.kind ?? "Her yazıya kendi masası";
  const author = book?.author ? `@${book.author}` : "";
  const font = await garamond(`${title}${kind}${author}Booktion'da oku`);
  const titleSize = title.length > 60 ? 64 : title.length > 32 ? 84 : 108;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 56,
          background: `radial-gradient(70% 90% at 0% 0%, rgba(227,175,100,0.3), rgba(227,175,100,0) 60%), ${BRAND.ink}`,
          fontFamily: font ? "Garamond" : "serif",
        }}
      >
        {/* The page of a book, lying on the desk. */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px",
            background: BRAND.paper,
            color: BRAND.ink,
            borderRadius: 18,
            boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, letterSpacing: 5, color: "#9a6a22" }}>
            <div style={{ width: 40, height: 2, background: BRAND.caramel }} />
            {kind.toLocaleUpperCase("tr-TR")}
          </div>
          <div style={{ display: "flex", fontSize: titleSize, lineHeight: 1.05, letterSpacing: -1 }}>{title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 32 }}>
            <div style={{ color: "#535b78" }}>{author}</div>
            <div style={{ display: "flex", alignItems: "flex-end", fontSize: 40 }}>
              Booktion
              <Diamond size={12} />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Garamond", data: font, weight: 500, style: "normal" }] : undefined },
  );
}

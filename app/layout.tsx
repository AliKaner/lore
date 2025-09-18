import type { Metadata } from "next";
import { Cinzel_Decorative, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel-decorative",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
});

export const metadata: Metadata = {
  title: "Lore Universe",
  description: "Discover the rich lore and stories that shape our universe",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon-32x32.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Lore Universe",
    description: "Discover the rich lore and stories that shape our universe",
    url: "https://your-domain.com",
    siteName: "Lore Universe",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Lore Universe Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lore Universe",
    description: "Discover the rich lore and stories that shape our universe",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${cinzelDecorative.variable} ${cormorantGaramond.variable}`}
      >
        {children}
      </body>
    </html>
  );
}

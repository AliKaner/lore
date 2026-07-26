import type { Metadata } from "next";
import { Cinzel_Decorative, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "./constants/site";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
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
    title: SITE_NAME,
    description: "Discover the rich lore and stories that shape our universe",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 500,
        height: 500,
        alt: `${SITE_NAME} Logo`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Discover the rich lore and stories that shape our universe",
    images: [DEFAULT_OG_IMAGE],
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import "./desk.css";
import { Providers } from "./providers";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "./constants/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: false },
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "Kitaplar, eskizler ve ?iirler i?in ki?isel yaz? alan?",
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
    description: "Kitaplar, eskizler ve ?iirler i?in ki?isel yaz? alan?",
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
    description: "Kitaplar, eskizler ve ?iirler i?in ki?isel yaz? alan?",
    images: [DEFAULT_OG_IMAGE],
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

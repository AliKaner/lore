import type { Metadata } from "next";
import { Cinzel, Lora, Playfair_Display, Caveat, Dancing_Script, Special_Elite, Courier_Prime, Kalam } from "next/font/google";
import "./globals.css";
import "./desk.css";
import { Providers } from "./providers";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "./constants/site";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
});

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700", "900"], variable: "--font-playfair" });
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-caveat" });
const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-dancing" });
const specialElite = Special_Elite({ subsets: ["latin"], weight: ["400"], variable: "--font-typewriter" });
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono-journal" });
const kalam = Kalam({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--font-kalam" });

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
      <body className={`${cinzel.variable} ${lora.variable} ${playfair.variable} ${caveat.variable} ${dancingScript.variable} ${specialElite.variable} ${courierPrime.variable} ${kalam.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

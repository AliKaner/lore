import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Instrument_Sans, Instrument_Serif, Newsreader } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@/lib/convexAuth";
import Header from "@/components/Header";
import ToastProvider from "@/components/Toaster";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});
const serif = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});
const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Booktion — Her bölüm, yeni bir hikâyenin başlangıcı",
  description:
    "Kitabını bölüm bölüm yaz; okurların sevdikleri bir bölümden kendi dallarını açsın. Hikâye haritası, karakter ve mekân paketleri, yorumlar — hepsi tek yerde.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${display.variable} ${serif.variable} ${sans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense>
          <ConvexAuthNextjsServerProvider>
            <ToastProvider>
              <Header />
              <div className="flex-1">{children}</div>
            </ToastProvider>
          </ConvexAuthNextjsServerProvider>
        </Suspense>
      </body>
    </html>
  );
}

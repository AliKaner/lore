import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { EB_Garamond, Literata } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@/lib/convexAuth";
import Header from "@/components/Header";
import ToastProvider from "@/components/Toaster";
import { ThemeSync } from "@/components/ThemePicker";
import { THEME_BOOT_SCRIPT } from "@/lib/themes";
import "./globals.css";

const garamond = EB_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
});
const literata = Literata({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-literata",
});

export const metadata: Metadata = {
  title: "Booktion — Her yazıya kendi masası",
  description:
    "Romanını, köşe yazını, röportajını ya da günlüğünü yaz; her tür kendi şablonuyla gelir. Kurmacada okurların hikâyeni dallandırır.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${garamond.variable} ${literata.variable} h-full`}
      // The boot script sets the theme attributes before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense>
          <ConvexAuthNextjsServerProvider>
            <ToastProvider>
              <ThemeSync />
              <Header />
              <div className="flex-1">{children}</div>
            </ToastProvider>
          </ConvexAuthNextjsServerProvider>
        </Suspense>
      </body>
    </html>
  );
}

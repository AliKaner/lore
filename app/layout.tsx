import type { Metadata, Viewport } from "next";
import { SITE_NAME, SITE_TEXT, SITE_URL } from "@/lib/site";
import { Suspense, type ReactNode } from "react";
import { EB_Garamond, Literata } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@/lib/convexAuth";
import Header from "@/components/Header";
import ToastProvider from "@/components/Toaster";
import { ThemeSync } from "@/components/ThemePicker";
import { THEME_BOOT_SCRIPT } from "@/lib/themes";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/locale";
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

// The reader's language: their choice (a cookie), else English.
async function currentLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const text = SITE_TEXT[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: text.title, template: `%s · ${SITE_NAME}` },
    description: text.description,
    applicationName: SITE_NAME,
    keywords: [
      "yazı", "roman yaz", "öykü", "şiir", "köşe yazısı", "röportaj", "günlük", "journal",
      "yazar", "hikâye", "dallanan hikâye", "writing app", "novel writing", "worldbuilding",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: SITE_URL,
      title: text.title,
      description: text.description,
      locale: locale === "en" ? "en_GB" : "tr_TR",
      alternateLocale: locale === "en" ? ["tr_TR"] : ["en_GB"],
    },
    twitter: { card: "summary_large_image", title: text.title, description: text.description },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false, email: false, address: false },
    appleWebApp: { title: SITE_NAME, capable: true, statusBarStyle: "default" },
  };
}

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ["tr", "en"],
      description: SITE_TEXT.tr.description,
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      description: SITE_TEXT.en.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1939" },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await currentLocale();
  return (
    <html
      lang={locale}
      className={`${garamond.variable} ${literata.variable} h-full`}
      // The boot script sets the theme attributes before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          // Tells search engines and AI assistants what Booktion is.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <Suspense>
          <ConvexAuthNextjsServerProvider>
            <I18nProvider initialLocale={locale}>
              <ToastProvider>
                <ThemeSync />
                <Header />
                <div className="flex-1">{children}</div>
              </ToastProvider>
            </I18nProvider>
          </ConvexAuthNextjsServerProvider>
        </Suspense>
      </body>
    </html>
  );
}

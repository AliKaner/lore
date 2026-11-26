"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/locale";
import { intlLocale, translate, type Entry, type Vars } from "@/lib/translate";

export type { Locale };

export { translate, intlLocale };
export type { Vars, Entry };

type I18n = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (text: string, vars?: Vars) => string;
  // A number in the reader's own way: 1.234 or 1,234.
  num: (n: number) => string;
  // Lower case that knows Turkish I/İ and English I apart.
  lower: (text: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // Server-rendered bits (the page title) follow on the next render.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18n>(() => {
    const tag = intlLocale(locale);
    return {
      locale,
      setLocale,
      t: (text, vars) => translate(locale, text, vars),
      num: (n) => n.toLocaleString(tag),
      lower: (text) => text.toLocaleLowerCase(tag),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider.");
  return value;
}

export function useT() {
  return useI18n().t;
}

// Language switch: two letters, for headers and the sign-in page.
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  return (
    <div role="radiogroup" aria-label="Language / Dil" className={`inline-flex rounded-full border border-border p-0.5 text-[11px] font-semibold ${className}`}>
      {(["tr", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={locale === option}
          onClick={() => setLocale(option)}
          className={`rounded-full px-2 py-0.5 uppercase tracking-wide transition-colors ${
            locale === option ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/locale";
import { translate, type Vars } from "@/lib/translate";

// The reader's language on the server: their choice (a cookie), else English.
export async function currentLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(chosen) ? chosen : DEFAULT_LOCALE;
}

export type T = (text: string, vars?: Vars) => string;

export async function getT(): Promise<{ t: T; locale: Locale }> {
  const locale = await currentLocale();
  return { t: (text, vars) => translate(locale, text, vars), locale };
}

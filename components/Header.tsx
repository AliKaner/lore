"use client";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
export default function Header() {
  const { locale, setLocale } = useLocale();
  return <header className="desk-header"><Link href="/" className="desk-brand-mini">← Yazı masam</Link><div><button onClick={() => setLocale(locale === "tr" ? "en" : "tr")}>{locale === "tr" ? "English" : "Türkçe"}</button></div></header>;
}

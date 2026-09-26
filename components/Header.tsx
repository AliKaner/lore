"use client";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
export default function Header() {
  const { locale, setLocale } = useLocale();
  return <header className="desk-header" style={{ background: "#f9faf6", color: "#46533d" }}><Link href="/">← Yazı masam</Link><div><button onClick={() => setLocale(locale === "tr" ? "en" : "tr")}>{locale === "tr" ? "English" : "Türkçe"}</button></div></header>;
}

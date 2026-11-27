"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import BookCover from "@/components/BookCover";
import Loading from "@/components/Loading";
import { useI18n } from "@/lib/i18n";
import { AVERAGE_WPM, FLOW_WPM, readingTime } from "@/lib/readingTime";

type Category = "all" | "classics" | "book" | "story";

// The open shelf: books anyone can read and write on from. For now the
// classics (public-domain books) fill it; they are one category of it.
export default function BooksPage() {
  const books = useQuery(api.classics.list, {});
  const { t, num } = useI18n();
  const [category, setCategory] = useState<Category>("all");
  const [lang, setLang] = useState<"all" | "tr" | "en">("all");

  const shown = useMemo(
    () =>
      (books ?? []).filter(
        (b) =>
          (lang === "all" || b.language === lang) &&
          (category === "all" || category === "classics" || b.kind === category),
      ),
    [books, lang, category],
  );
  const chip = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm transition-colors ${active ? "bg-foreground text-background" : "border border-border text-muted hover:border-border-hover hover:text-foreground"}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-5xl leading-tight sm:text-6xl">{t("Kitaplar")}</h1>
      <p className="mt-3 max-w-2xl text-[17px] text-muted">
        {t("Bölüm bölüm oku; istediğin bölümden kendi dalını aç ve hikâyeyi sen devam ettir.")}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(
          [
            ["all", t("Tümü")],
            ["classics", t("Klasikler")],
            ["book", t("Romanlar")],
            ["story", t("Öyküler")],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={chip(category === value)}>
            {label}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
        {(
          [
            ["all", t("Her dil")],
            ["tr", "Türkçe"],
            ["en", "English"],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={lang === value} onClick={() => setLang(value)} className={chip(lang === value)}>
            {label}
          </button>
        ))}
      </div>

      {category === "classics" && (
        <p className="mt-5 max-w-2xl text-sm text-muted">
          {t("Telif süresi dolmuş, herkesin olan kitaplar. Kaynakları ve lisansları her kitabın sayfasında.")}
        </p>
      )}

      {books === undefined ? (
        <div className="mt-10">
          <Loading />
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-muted">{t("Bu rafta henüz kitap yok.")}</p>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((book) => (
            <li key={book._id} className="group">
              <Link href={`/book/${book._id}`} className="block">
                <BookCover
                  storageId={book.coverStorageId ?? undefined}
                  title={book.title}
                  author={book.author}
                  overlay
                  className="aspect-[2/3] w-full rounded-md shadow-[0_22px_44px_-24px_rgba(15,25,57,0.65)] transition-transform duration-300 group-hover:-translate-y-1"
                />
              </Link>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-caramel-strong">
                {t("Klasik")} · {book.language === "en" ? "English" : "Türkçe"}
              </p>
              <Link href={`/book/${book._id}`} className="mt-1 block font-display text-xl leading-snug hover:text-accent">
                {book.title}
              </Link>
              <p className="text-sm text-muted">
                {book.author}
                {book.year ? ` · ${book.year}` : ""}
              </p>
              <p className="mt-1 text-xs tabular-nums text-muted">
                {t("{n} bölüm", { n: num(book.chapters) })} · {readingTime(book.words, AVERAGE_WPM, t, num)}
              </p>
              <p className="text-xs tabular-nums text-muted" title={t("Akış modunda, dakikada {n} kelime", { n: FLOW_WPM })}>
                {t("Hızlı okumada {time}", { time: readingTime(book.words, FLOW_WPM, t, num) })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

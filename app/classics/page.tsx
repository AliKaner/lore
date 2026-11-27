"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import BookCover from "@/components/BookCover";
import Loading from "@/components/Loading";
import { useI18n } from "@/lib/i18n";

// The shelf of public-domain books: free to read, and anyone may write on
// from any chapter as a branch of their own.
export default function ClassicsPage() {
  const books = useQuery(api.classics.list, {});
  const { t, num } = useI18n();
  const [lang, setLang] = useState<"all" | "tr" | "en">("all");
  const shown = useMemo(() => (books ?? []).filter((b) => lang === "all" || b.language === lang), [books, lang]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-caramel">{t("Kamu malı")}</p>
      <h1 className="mt-2 font-display text-5xl leading-tight">{t("Klasikler")}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {t("Telif süresi dolmuş kitaplar, bölüm bölüm. Ücretsiz oku; istediğin bölümden kendi dalını aç ve hikâyeyi sen devam ettir.")}
      </p>
      <div role="radiogroup" aria-label={t("Dil")} className="mt-6 inline-flex rounded-full bg-accent-soft/60 p-0.5 text-sm">
        {(
          [
            ["all", t("Hepsi")],
            ["tr", "Türkçe"],
            ["en", "English"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={lang === value}
            onClick={() => setLang(value)}
            className={`rounded-full px-4 py-1 transition-colors ${lang === value ? "bg-surface font-medium shadow-sm" : "text-muted hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {books === undefined ? (
        <div className="mt-10">
          <Loading />
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-10 text-muted">{t("Bu rafta henüz kitap yok.")}</p>
      ) : (
        <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((book) => (
            <li key={book._id} className="group flex gap-4">
              <Link href={`/book/${book._id}`} className="shrink-0">
                <BookCover
                  storageId={book.coverStorageId ?? undefined}
                  title={book.title}
                  placeholder={book.author}
                  className="h-40 w-28 rounded-md shadow-[0_14px_30px_-18px_rgba(15,25,57,0.55)] transition-transform group-hover:-translate-y-0.5"
                />
              </Link>
              <div className="min-w-0">
                <p className="text-xs text-caramel-strong">
                  {book.author}
                  {book.year ? ` · ${book.year}` : ""}
                </p>
                <Link href={`/book/${book._id}`} className="mt-1 block font-display text-2xl leading-tight hover:text-accent">
                  {book.title}
                </Link>
                {book.description && <p className="mt-1.5 line-clamp-3 text-sm text-muted">{book.description}</p>}
                <p className="mt-2 text-xs tabular-nums text-muted">
                  {t("{n} bölüm", { n: num(book.chapters) })} · {t("{n} kelime", { n: num(book.words) })}
                </p>
                <Link
                  href={`/book/${book._id}/chapter/${book.rootChapterId}`}
                  className="mt-3 inline-flex rounded-full border border-border px-4 py-1.5 text-sm hover:border-accent hover:text-accent"
                >
                  {t("Okumaya başla")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

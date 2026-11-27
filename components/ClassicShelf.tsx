"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import BookCover from "@/components/BookCover";
import { useI18n } from "@/lib/i18n";

// A classic author's books, on their profile.
export default function ClassicShelf({ author }: { author: string }) {
  const books = useQuery(api.classics.list, {});
  const { t, num } = useI18n();
  const mine = (books ?? []).filter((b) => b.author === author);
  if (mine.length === 0) return null;
  return (
    <section className="mb-8 mt-6">
      <h2 className="mb-4 font-display text-2xl">{t("Kitapları")}</h2>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3">
        {mine.map((book) => (
          <li key={book._id} className="group">
            <Link href={`/book/${book._id}`}>
              <BookCover
                storageId={book.coverStorageId ?? undefined}
                title={book.title}
                author={book.author}
                overlay
                className="aspect-[2/3] w-full rounded-md shadow-[0_18px_36px_-22px_rgba(15,25,57,0.6)] transition-transform group-hover:-translate-y-0.5"
              />
              <p className="mt-3 font-display text-lg leading-snug group-hover:text-accent">{book.title}</p>
            </Link>
            <p className="text-xs text-muted">
              {book.year ? `${book.year} · ` : ""}
              {t("{n} bölüm", { n: num(book.chapters) })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

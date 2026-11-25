"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import BookCover from "@/components/BookCover";
import Loading from "@/components/Loading";
import SignInPrompt from "@/components/SignInPrompt";
import { buttonPrimary, cardHover, cardList } from "@/lib/ui";
import { kindConfig } from "@/lib/writingKinds";

export default function MyWritingsPage() {
  const me = useQuery(api.users.me);
  const books = useQuery(api.books.listMine, me ? {} : "skip");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Yazılarım</h1>
          <p className="mt-1 text-sm text-muted">
            Bir yazıyı okutmak için sayfasındaki paylaş düğmesiyle bağlantısını gönder.
          </p>
        </div>
        <Link href="/yaz" className={buttonPrimary}>
          Yeni yazı
        </Link>
      </div>

      {me === undefined ? (
        <Loading />
      ) : me === null ? (
        <SignInPrompt message="Yazılarını görmek için giriş yapman gerekiyor." />
      ) : books === undefined ? (
        <Loading label="Yazıların yükleniyor…" />
      ) : books.length === 0 ? (
        <p className="text-muted">
          Henüz bir yazın yok.{" "}
          <Link href="/yaz" className="underline">
            İlkini yaz
          </Link>
          .
        </p>
      ) : (
        <ul className={cardList}>
          {books.map((book) => (
            <li key={book._id} className={cardHover}>
              <Link href={`/kitap/${book._id}`} className="flex gap-3">
                <BookCover
                  storageId={book.coverStorageId}
                  title={book.title}
                  placeholder="kapak yok"
                  className="h-20 w-14 shrink-0 rounded"
                />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sapphire">
                    {kindConfig(book).label}
                  </p>
                  <h2 className="font-medium">{book.title}</h2>
                  {book.description && (
                    <p className="mt-1 text-sm text-muted">{book.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    {book.visibility === "public" ? "Bağlantıyla okunabilir" : "Gizli"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

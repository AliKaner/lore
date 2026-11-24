"use client";

import Link from "next/link";
import { Unauthenticated, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import BookCover from "@/components/BookCover";
import Loading from "@/components/Loading";
import NewBookButton from "@/components/NewBookButton";
import { buttonLink, cardHover, cardList } from "@/lib/ui";

function BookCard({ book }: { book: Doc<"books"> }) {
  return (
    <li className={cardHover}>
      <Link href={`/kitap/${book._id}`} className="flex gap-3">
        <BookCover
          storageId={book.coverStorageId}
          title={book.title}
          placeholder="kapak yok"
          className="h-20 w-14 rounded shrink-0"
        />
        <div>
          <h2 className="font-medium">{book.title}</h2>
          {book.description && (
            <p className="text-muted text-sm mt-1">{book.description}</p>
          )}
          <p className="text-muted text-xs mt-2">
            {book.likeCount} beğeni · {book.shareCount} paylaşım
          </p>
        </div>
      </Link>
    </li>
  );
}

export default function Home() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.books.listPublic,
    {},
    { initialNumItems: 20 },
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-1">Keşfet</h1>
      <p className="text-muted mb-6 text-sm">
        Herkese açık kitaplar. Bir bölümü oku, beğen, yorum yap ya da
        istediğin bölümden kendi hikayeni yazmaya başla.
      </p>
      <Unauthenticated>
        <p className="text-muted mb-6 text-sm">
          Okumak için hesaba gerek yok.{" "}
          <Link href="/giris" className="underline">
            Giriş yap
          </Link>{" "}
          — beğenmek, yorum yapmak veya kendi hikayeni yazmak istediğinde
          gerekecek.
        </p>
      </Unauthenticated>

      {status === "LoadingFirstPage" ? (
        <Loading label="Kitaplar yükleniyor…" />
      ) : results.length === 0 ? (
        <p className="text-muted">
          Henüz hiç kitap yok.{" "}
          <NewBookButton className="underline">İlk kitabı sen yaz</NewBookButton>.
        </p>
      ) : (
        <ul className={cardList}>
          {results.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </ul>
      )}

      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(20)} className={`${buttonLink} mt-6`}>
          Daha fazla göster
        </button>
      )}
    </main>
  );
}

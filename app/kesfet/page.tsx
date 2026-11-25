"use client";

import { useState } from "react";
import Link from "next/link";
import { Unauthenticated, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { WritingKind } from "@/convex/writingKinds";
import BookCover from "@/components/BookCover";
import Loading from "@/components/Loading";
import { buttonLink, cardHover, cardList } from "@/lib/ui";
import { KIND_ORDER, KINDS, kindConfig } from "@/lib/writingKinds";

function KindFilter({
  value,
  onChange,
}: {
  value: WritingKind | undefined;
  onChange: (kind: WritingKind | undefined) => void;
}) {
  const options: { kind: WritingKind | undefined; label: string }[] = [
    { kind: undefined, label: "Tümü" },
    ...KIND_ORDER.map((kind) => ({ kind, label: KINDS[kind].label })),
  ];
  return (
    <div role="group" aria-label="Türe göre filtrele" className="mb-6 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.kind === value;
        return (
          <button
            key={option.label}
            aria-pressed={active}
            onClick={() => onChange(option.kind)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              active
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border text-foreground hover:border-border-hover"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sapphire">
            {kindConfig(book).label}
          </p>
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
  const [kind, setKind] = useState<WritingKind | undefined>(undefined);
  const community = useQuery(api.books.communityStatus);
  const { results, status, loadMore } = usePaginatedQuery(
    api.books.listPublic,
    community?.open ? (kind ? { kind } : {}) : "skip",
    { initialNumItems: 20 },
  );

  if (community === undefined) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Loading />
      </main>
    );
  }
  if (!community.open) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Keşfet yakında açılıyor</h1>
        <p className="mt-3 text-muted">
          Keşfet, beğeniler, yorumlar ve okur dalları Booktion&apos;da{" "}
          {community.threshold} yazı olduğunda açılacak. O zamana kadar bir
          yazı yalnızca yazarının paylaştığı bağlantıyla okunur.
        </p>
        <p className="mt-2 text-sm text-muted">
          Şu an {community.bookCount}/{community.threshold}.
        </p>
        <Link href="/yaz" className="mt-6 inline-block underline">
          Sen de bir yazı başlat
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-1">Keşfet</h1>
      <p className="text-muted mb-6 text-sm">
        Herkese açık kitaplar, öyküler, şiirler, köşe yazıları ve
        röportajlar. Oku, beğen, yorum yap — kurmacada istediğin yerden kendi
        dalını yaz.
      </p>
      <KindFilter value={kind} onChange={setKind} />
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
          Burada henüz bir şey yok.{" "}
          <Link href="/yaz" className="underline">
            İlkini sen yaz
          </Link>
          .
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

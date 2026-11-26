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
import { KIND_ORDER } from "@/lib/writingKinds";
import { useKindConfig, useWritingKinds } from "@/lib/localized";
import { useT } from "@/lib/i18n";

function KindFilter({
  value,
  onChange,
}: {
  value: WritingKind | undefined;
  onChange: (kind: WritingKind | undefined) => void;
}) {
  const t = useT();
  const kinds = useWritingKinds();
  const options: { kind: WritingKind | undefined; label: string }[] = [
    { kind: undefined, label: t("Tümü") },
    ...KIND_ORDER.map((kind) => ({ kind, label: kinds[kind].label })),
  ];
  return (
    <div role="group" aria-label={t("Türe göre filtrele")} className="mb-6 flex flex-wrap gap-2">
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
  const t = useT();
  const cfg = useKindConfig(book);
  return (
    <li className={cardHover}>
      <Link href={`/kitap/${book._id}`} className="flex gap-3">
        <BookCover
          storageId={book.coverStorageId}
          title={book.title}
          placeholder={t("kapak yok")}
          className="h-20 w-14 rounded shrink-0"
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sapphire">
            {cfg.label}
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
  const t = useT();

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
        <h1 className="text-3xl font-semibold">{t("Keşfet yakında açılıyor")}</h1>
        <p className="mt-3 text-muted">
          {t("Keşfet, beğeniler, yorumlar ve okur dalları Booktion'da {n} yazı olduğunda açılacak. O zamana kadar bir yazı yalnızca yazarının paylaştığı bağlantıyla okunur.", { n: community.threshold })}
        </p>
        <p className="mt-2 text-sm text-muted">
          {t("Şu an {count}/{total}.", { count: community.bookCount, total: community.threshold })}
        </p>
        <Link href="/yaz" className="mt-6 inline-block underline">
          {t("Sen de bir yazı başlat")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-1">{t("Keşfet")}</h1>
      <p className="text-muted mb-6 text-sm">
        {t("Herkese açık kitaplar, öyküler, şiirler, köşe yazıları ve röportajlar. Oku, beğen, yorum yap — kurmacada istediğin yerden kendi dalını yaz.")}
      </p>
      <KindFilter value={kind} onChange={setKind} />
      <Unauthenticated>
        <p className="text-muted mb-6 text-sm">
          {t("Okumak için hesaba gerek yok.")}{" "}
          <Link href="/giris" className="underline">
            {t("Giriş yap")}
          </Link>{" "}
          {t("— beğenmek, yorum yapmak veya kendi hikayeni yazmak istediğinde gerekecek.")}
        </p>
      </Unauthenticated>

      {status === "LoadingFirstPage" ? (
        <Loading label={t("Kitaplar yükleniyor…")} />
      ) : results.length === 0 ? (
        <p className="text-muted">
          {t("Burada henüz bir şey yok.")}{" "}
          <Link href="/yaz" className="underline">
            {t("İlkini sen yaz")}
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
          {t("Daha fazla göster")}
        </button>
      )}
    </main>
  );
}

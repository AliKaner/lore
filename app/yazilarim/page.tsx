"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import BookCover from "@/components/BookCover";
import Loading from "@/components/Loading";
import SignInPrompt from "@/components/SignInPrompt";
import EmptyState from "@/components/EmptyState";
import SecureAccountNudge from "@/components/SecureAccountNudge";
import { buttonPrimary } from "@/lib/ui";
import { kindConfig } from "@/lib/writingKinds";
import { GoalsCard } from "@/components/Goals";
import { timeAgo, useNow } from "@/lib/useNow";

type DeskBook = FunctionReturnType<typeof api.books.myDesk>[number];

const number = (n: number) => n.toLocaleString("tr-TR");

function greeting(now: number) {
  if (!now) return "Masana hoş geldin";
  const hour = new Date(now).getHours();
  if (hour < 5) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function continueHref(book: DeskBook) {
  return book.lastChapter
    ? `/kitap/${book._id}/bolum/${book.lastChapter._id}/duzenle`
    : `/kitap/${book._id}/yaz`;
}

function stats(book: DeskBook) {
  const parts: string[] = [];
  const chapters = book.chapterCount ?? 0;
  if (chapters > 0) parts.push(`${chapters} ${kindConfig(book).unit.toLocaleLowerCase("tr-TR")}`);
  parts.push(`${number(book.wordCount ?? 0)} kelime`);
  return parts.join(" · ");
}

function Visibility({ book }: { book: DeskBook }) {
  const open = book.visibility === "public";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${open ? "text-sapphire" : "text-muted"}`}
      title={open ? "Bağlantısı olan herkes okuyabilir" : "Yalnızca sen görürsün"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-sapphire" : "bg-border-hover"}`} />
      {open ? "Bağlantıyla açık" : "Gizli"}
    </span>
  );
}

// The writing the writer was last in, front and centre.
function ContinueCard({ book, now }: { book: DeskBook; now: number }) {
  const cfg = kindConfig(book);
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-40px_rgba(15,25,57,0.45)]">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,var(--caramel),transparent)] opacity-70"
      />
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <BookCover
          storageId={book.coverStorageId}
          title={book.title}
          placeholder={cfg.label}
          className="hidden h-36 w-24 shrink-0 rounded-md shadow-[0_12px_30px_-18px_rgba(15,25,57,0.6)] sm:block"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-caramel">
            Kaldığın yerden devam et
          </p>
          <h2 className="mt-2 truncate font-display text-3xl leading-tight">
            <Link href={`/kitap/${book._id}`} className="hover:text-accent">
              {book.title}
            </Link>
          </h2>
          {book.lastChapter ? (
            <p className="mt-2 text-[15px] text-foreground">
              <span className="text-muted">Son çalıştığın: </span>
              <span className="font-display italic">{book.lastChapter.title}</span>
              {book.lastChapter.status === "draft" && (
                <span className="ml-2 rounded-full bg-caramel-soft px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                  taslak
                </span>
              )}
            </p>
          ) : (
            <p className="mt-2 text-[15px] text-muted">Henüz bir şey yazılmamış.</p>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{cfg.label}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{stats(book)}</span>
            {book.lastEditedAt && now > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{timeAgo(book.lastEditedAt, now)} düzenlendi</span>
              </>
            )}
          </p>
        </div>
        <Link
          href={continueHref(book)}
          className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-accent px-7 text-[15px] font-medium text-accent-contrast shadow-[0_12px_28px_-14px_rgba(38,66,139,0.9)] transition-colors hover:bg-accent-hover sm:self-center"
        >
          {book.lastChapter ? "Devam et" : "Yazmaya başla"}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}

function DeskRow({ book, now }: { book: DeskBook; now: number }) {
  const cfg = kindConfig(book);
  return (
    <li className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-caramel-soft/30 sm:px-5">
      <BookCover
        storageId={book.coverStorageId}
        title={book.title}
        placeholder=""
        className="h-16 w-11 shrink-0 rounded"
      />
      <Link href={`/kitap/${book._id}`} className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sapphire">{cfg.label}</p>
        <p className="truncate font-display text-xl leading-snug text-foreground group-hover:text-accent">
          {book.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span className="tabular-nums">{stats(book)}</span>
          {book.lastEditedAt && now > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{timeAgo(book.lastEditedAt, now)}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <Visibility book={book} />
        </p>
      </Link>
      <Link
        href={continueHref(book)}
        className="hidden shrink-0 rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent sm:inline-flex"
      >
        {book.lastChapter ? "Devam et" : "Başla"}
      </Link>
    </li>
  );
}

export default function MyWritingsPage() {
  const me = useQuery(api.users.me);
  const books = useQuery(api.books.myDesk, me ? {} : "skip");
  const now = useNow();

  const totalWords = (books ?? []).reduce((sum, b) => sum + (b.wordCount ?? 0), 0);
  const [first, ...rest] = books ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">
            {me?.username ? `${greeting(now)}, @${me.username}` : greeting(now)}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight">Yazılarım</h1>
          {books && books.length > 0 && (
            <p className="mt-1 text-sm tabular-nums text-muted">
              {books.length} yazı · {number(totalWords)} kelime
            </p>
          )}
        </div>
        <Link href="/yaz" className={`${buttonPrimary} rounded-full px-5`}>
          + Yeni yazı
        </Link>
      </div>

      {me && <SecureAccountNudge />}
      {me && <GoalsCard />}

      {me === undefined ? (
        <Loading />
      ) : me === null ? (
        <SignInPrompt title="Yazılarını görmek için giriş yap" />
      ) : books === undefined ? (
        <Loading label="Yazıların yükleniyor…" />
      ) : books.length === 0 ? (
        <EmptyState
          art="blank"
          eyebrow="Masan hazır"
          title="İlk yazın burada başlayacak"
          actions={
            <Link href="/yaz" className={`${buttonPrimary} px-6`}>
              Bir tür seç, yazmaya başla
            </Link>
          }
        >
          <p>
            Roman, öykü, şiir, köşe yazısı, röportaj ya da günlük: her tür kendi
            şablonuyla açılır. Yazdıkça taslağın kendiliğinden kaydedilir.
          </p>
        </EmptyState>
      ) : (
        <>
          {first && <ContinueCard book={first} now={now} />}
          {rest.length > 0 && (
            <>
              <h2 className="mb-3 mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Diğer yazıların
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
                {rest.map((book) => (
                  <DeskRow key={book._id} book={book} now={now} />
                ))}
              </ul>
            </>
          )}
          <p className="mt-8 text-center text-xs text-muted">
            Bir yazıyı okutmak için sayfasındaki “Paylaş” düğmesiyle bağlantısını gönder.
          </p>
        </>
      )}
    </main>
  );
}

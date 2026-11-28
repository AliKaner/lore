"use client";

import Link from "next/link";
import WritingActivity from "@/components/WritingActivity";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import BookCover from "@/components/BookCover";
import Loading from "@/components/Loading";
import SignInPrompt from "@/components/SignInPrompt";
import EmptyState from "@/components/EmptyState";
import { buttonPrimary } from "@/lib/ui";
import { useWritingKinds } from "@/lib/localized";
import { useI18n } from "@/lib/i18n";
import type { KindConfig } from "@/lib/writingKinds";
import { GoalsCard } from "@/components/Goals";
import Drafts from "@/components/Drafts";
import { timeAgo, useNow } from "@/lib/useNow";

type DeskBook = FunctionReturnType<typeof api.books.myDesk>[number];

type I18n = ReturnType<typeof useI18n>;

function greeting(now: number) {
  if (!now) return "Masana hoş geldin";
  const hour = new Date(now).getHours();
  if (hour < 5) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

// The writing kinds in the reader's language, picked for a book.
function useCfg() {
  const kinds = useWritingKinds();
  return (book: DeskBook): KindConfig => kinds[book.kind ?? "book"];
}

function continueHref(book: DeskBook) {
  return book.lastChapter
    ? `/book/${book._id}/chapter/${book.lastChapter._id}/edit`
    : `/book/${book._id}/write`;
}

// The writing as its readers see it, from the first page.
function readHref(book: DeskBook) {
  return book.rootChapterId ? `/book/${book._id}/chapter/${book.rootChapterId}` : null;
}

function stats(book: DeskBook, cfg: KindConfig, { t, num, lower, locale }: I18n) {
  const parts: string[] = [];
  const chapters = book.chapterCount ?? 0;
  if (chapters > 0) {
    // "3 bölüm" / "3 chapters".
    const unit = lower(cfg.unit);
    parts.push(`${chapters} ${locale === "en" && chapters !== 1 ? `${unit}s` : unit}`);
  }
  parts.push(t("{n} kelime", { n: num(book.wordCount ?? 0) }));
  return parts.join(" · ");
}

function Visibility({ book }: { book: DeskBook }) {
  const open = book.visibility === "public";
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${open ? "text-sapphire" : "text-muted"}`}
      title={open ? t("Bağlantısı olan herkes okuyabilir") : t("Yalnızca sen görürsün")}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-sapphire" : "bg-border-hover"}`} />
      {open ? t("Bağlantıyla açık") : t("Gizli")}
    </span>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M10 5.5C8.5 4.3 6.3 3.8 3 4v11c3.3-.2 5.5.3 7 1.5 1.5-1.2 3.7-1.7 7-1.5V4c-3.3-.2-5.5.3-7 1.5zM10 5.5v11" />
    </svg>
  );
}

// The writing the writer was last in, front and centre.
function ContinueCard({ book, now }: { book: DeskBook; now: number }) {
  const cfg = useCfg()(book);
  const i18n = useI18n();
  const { t, locale } = i18n;
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
            {t("Kaldığın yerden devam et")}
          </p>
          <h2 className="mt-2 truncate font-display text-3xl leading-tight">
            <Link href={`/book/${book._id}`} className="hover:text-accent">
              {book.title}
            </Link>
          </h2>
          {book.lastChapter ? (
            <p className="mt-2 text-[15px] text-foreground">
              <span className="text-muted">{t("Son çalıştığın:")} </span>
              <span className="font-display italic">{book.lastChapter.title}</span>
              {book.lastChapter.status === "draft" && (
                <span className="ml-2 rounded-full bg-caramel-soft px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-foreground/70">
                  {t("taslak")}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-2 text-[15px] text-muted">{t("Henüz bir şey yazılmamış.")}</p>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{cfg.label}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{stats(book, cfg, i18n)}</span>
            {book.lastEditedAt && now > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{t("{when} düzenlendi", { when: timeAgo(book.lastEditedAt, now, locale) })}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:flex-col sm:items-stretch sm:self-center">
          <Link
            href={continueHref(book)}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 text-[15px] font-medium text-accent-contrast shadow-[0_12px_28px_-14px_rgba(38,66,139,0.9)] transition-colors hover:bg-accent-hover"
          >
            {book.lastChapter ? t("Devam et") : t("Yazmaya başla")}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
          {readHref(book) && (
            <Link
              href={readHref(book)!}
              title={t("Okurların gördüğü gibi, baştan oku")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <BookIcon />
              {t("Oku")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function DeskRow({ book, now }: { book: DeskBook; now: number }) {
  const cfg = useCfg()(book);
  const i18n = useI18n();
  const { t, locale } = i18n;
  const read = readHref(book);
  return (
    <li className="group">
      <div className="relative">
        <Link href={`/book/${book._id}`} className="block">
          <BookCover
            storageId={book.coverStorageId}
            title={book.title}
            className="aspect-[2/3] w-full rounded-md shadow-[0_18px_36px_-22px_rgba(15,25,57,0.6)] transition-transform duration-300 group-hover:-translate-y-1"
          />
        </Link>
        {/* On hover: carry on writing, or read it as readers do. */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <Link href={continueHref(book)} className="flex-1 rounded-full bg-accent py-1.5 text-center text-xs font-medium text-accent-contrast shadow-lg hover:bg-accent-hover">
            {book.lastChapter ? t("Devam et") : t("Başla")}
          </Link>
          {read && (
            <Link href={read} className="rounded-full bg-surface/95 px-3 py-1.5 text-xs shadow-lg hover:text-accent">
              {t("Oku")}
            </Link>
          )}
        </div>
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sapphire">{cfg.label}</p>
      <Link href={`/book/${book._id}`} className="mt-0.5 line-clamp-2 block font-display text-lg leading-snug hover:text-accent">
        {book.title}
      </Link>
      <p className="mt-1 text-xs tabular-nums text-muted">{stats(book, cfg, i18n)}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
        {book.lastEditedAt && now > 0 && <span>{timeAgo(book.lastEditedAt, now, locale)}</span>}
        <Visibility book={book} />
      </p>
    </li>
  );
}

export default function MyWritingsPage() {
  const me = useQuery(api.users.me);
  const books = useQuery(api.books.myDesk, me ? {} : "skip");
  const shared = useQuery(api.members.sharedWithMe, me ? {} : "skip");
  const now = useNow();
  const { t, num } = useI18n();

  const totalWords = (books ?? []).reduce((sum, b) => sum + (b.wordCount ?? 0), 0);
  const [first, ...rest] = books ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">
            {me?.username ? `${t(greeting(now))}, @${me.username}` : t(greeting(now))}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight">{t("Yazılarım")}</h1>
          {books && books.length > 0 && (
            <p className="mt-1 text-sm tabular-nums text-muted">
              {t("{n} yazı", { n: books.length })} · {t("{n} kelime", { n: num(totalWords) })}
            </p>
          )}
        </div>
        <Link href="/new" className={`${buttonPrimary} rounded-full px-5`}>
          {t("+ Yeni yazı")}
        </Link>
      </div>

      {/* A year of writing first; on an empty desk the first step is a writing. */}
      {me && books && books.length > 0 && <WritingActivity />}

      {me === undefined ? (
        <Loading />
      ) : me === null ? (
        <SignInPrompt title={t("Yazılarını görmek için giriş yap")} />
      ) : books === undefined ? (
        <Loading label={t("Yazıların yükleniyor…")} />
      ) : books.length === 0 ? (
        <EmptyState
          art="blank"
          eyebrow={t("Masan hazır")}
          title={t("İlk yazın burada başlayacak")}
          actions={
            <Link href="/new" className={`${buttonPrimary} px-6`}>
              {t("Bir tür seç, yazmaya başla")}
            </Link>
          }
        >
          <p>
            {t("Roman, öykü, şiir, köşe yazısı, röportaj ya da günlük: her tür kendi şablonuyla açılır. Yazdıkça taslağın kendiliğinden kaydedilir.")}
          </p>
        </EmptyState>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
            {first && <ContinueCard book={first} now={now} />}
            <GoalsCard stacked />
          </div>
          <Drafts skip={first?.lastChapter?._id} />
          {rest.length > 0 && (
            <>
              <h2 className="mb-3 mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {t("Diğer yazıların")}
              </h2>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
                {rest.map((book) => (
                  <DeskRow key={book._id} book={book} now={now} />
                ))}
              </ul>
            </>
          )}
          <p className="mt-8 text-center text-xs text-muted">
            {t("Bir yazıyı okutmak için sayfasındaki “Paylaş” düğmesiyle bağlantısını gönder.")}
          </p>
        </>
      )}

      {shared && shared.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("Birlikte yazdıkların")}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {shared.map((book) => (
              <li key={book._id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                <Link href={`/book/${book._id}`} className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl leading-snug hover:text-accent">{book.title}</p>
                  <p className="text-xs text-muted">{t("@{name} ile birlikte", { name: book.ownerName ?? "—" })}</p>
                </Link>
                <Link href={`/book/${book._id}/board`} className="hidden rounded-full px-3 py-1.5 text-sm text-muted hover:bg-accent-soft/60 hover:text-foreground sm:inline-flex">
                  {t("Mantar pano")}
                </Link>
                <Link href={book.rootChapterId ? `/book/${book._id}/chapter/${book.rootChapterId}` : `/book/${book._id}/write`} className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-accent hover:text-accent">
                  {book.rootChapterId ? t("Oku") : t("Başla")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ChapterTree from "@/components/ChapterTree";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import FavoriteButton from "@/components/FavoriteButton";
import BookCover from "@/components/BookCover";
import BookTitleEditor from "@/components/BookTitleEditor";
import ImageUploader from "@/components/ImageUploader";
import ReportButton from "@/components/ReportButton";
import Loading from "@/components/Loading";
import DeleteButton from "@/components/DeleteButton";
import NotFoundState from "@/components/NotFoundState";
import ExportMenu from "@/components/ExportMenu";
import CoAuthors from "@/components/CoAuthors";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { buttonPrimary } from "@/lib/ui";
import { useEntityKinds, useKindConfig } from "@/lib/localized";
import { useI18n } from "@/lib/i18n";
import { useCommunityOpen } from "@/lib/community";
import { ENTITY_KIND_ORDER } from "@/convex/entityKinds";
import { KindGlyph } from "@/components/entity/shared";

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books"> }>;
}) {
  const { bookId } = use(params);
  const book = useQuery(api.books.get, { bookId });
  const chapters = useQuery(api.chapters.getTree, { bookId });
  const entities = useQuery(api.entities.listForBook, { bookId });
  const me = useQuery(api.users.me);
  const role = useQuery(api.members.myRole, { bookId });
  const openProposals = useQuery(api.proposals.openCount, { bookId });
  const setBookCover = useMutation(api.files.setBookCover);
  const showToast = useToast();
  const communityOpen = useCommunityOpen();
  const { t, num } = useI18n();
  const cfg = useKindConfig(book);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const entityKinds = useEntityKinds();

  if (book === undefined) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Loading />
      </main>
    );
  }
  if (book === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <NotFoundState />
      </main>
    );
  }

  async function handleCoverUpload(storageId: Id<"_storage">) {
    try {
      await setBookCover({ bookId, storageId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  const isOwner = me?._id === book.ownerId;
  // Owner and co-authors write here and plan on the corkboard.
  const isWriter = role === "owner" || role === "coauthor";
  const words = book.wordCount ?? (chapters ?? []).reduce((sum, c) => sum + (c.words ?? 0), 0);
  const mainLine = (chapters ?? []).filter((c) => c.isCanonical).length;
  const hours = Math.round(words / 220 / 6) / 10;
  const readTime = words < 220 * 60 ? t("~{n} dk", { n: Math.max(1, Math.round(words / 220)) }) : t("~{n} saat", { n: num(hours) });
  const ghost =
    "inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm transition-colors hover:border-accent hover:text-accent";

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      {/* The book itself: cover, name, who wrote it, how long, read it. */}
      <section className="relative grid gap-8 sm:grid-cols-[13rem_1fr] sm:gap-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-16 -top-16 bottom-0 -z-10 bg-[radial-gradient(ellipse_at_15%_0%,var(--caramel-soft),transparent_60%)] opacity-70 blur-2xl"
        />
        <BookCover
          storageId={book.coverStorageId}
          title={book.title}
          author={book.classic?.author}
          overlay={!!book.classic}
          className="mx-auto aspect-[2/3] w-44 rounded-md shadow-[0_28px_60px_-28px_rgba(15,25,57,0.7)] sm:w-52"
        />
        <div className="min-w-0 sm:pt-2">
          <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sapphire">
            {cfg.label}
            {book.classic && (
              <span className="rounded-full bg-caramel-soft px-2 py-0.5 normal-case tracking-normal text-foreground/80">
                {t("Klasik · Kamu malı")}
              </span>
            )}
            {book.visibility === "private" && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 normal-case tracking-normal text-foreground/80">{t("Gizli")}</span>
            )}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">{book.title}</h1>
          {book.classic && (
            <p className="mt-3 text-lg">
              {book.classic.author}
              {book.classic.year && <span className="text-muted"> · {book.classic.year}</span>}
            </p>
          )}
          {book.description && <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-foreground/80">{book.description}</p>}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {[
              [t("Bölüm"), num(mainLine)],
              [t("Kelime"), num(words)],
              [t("Okuma"), readTime],
              ...(chapters && chapters.length > mainLine ? [[t("Dal"), num(chapters.length - mainLine)]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</dt>
                <dd className="mt-0.5 font-display text-2xl tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            {book.rootChapterId ? (
              <Link href={`/book/${bookId}/chapter/${book.rootChapterId}`} className={`${buttonPrimary} h-11 rounded-full px-6 text-[15px]`}>
                {t("Okumaya başla")} →
              </Link>
            ) : isWriter ? (
              <Link href={`/book/${bookId}/write`} className={`${buttonPrimary} h-11 rounded-full px-6 text-[15px]`}>
                {cfg.firstUnitCta}
              </Link>
            ) : (
              <p className="text-sm text-muted">{t("Henüz bir şey yazılmamış.")}</p>
            )}
            <ShareButton targetType="book" targetId={bookId} shareCount={book.shareCount} />
            {communityOpen && <LikeButton targetType="book" targetId={bookId} likeCount={book.likeCount} />}
            {communityOpen && <FavoriteButton targetType="book" targetId={bookId} />}
            {isOwner && <ExportMenu bookId={bookId} />}
            {communityOpen && !isOwner && me && <ReportButton targetType="book" targetId={bookId} />}
          </div>

          {book.classic && (
            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">
              {t("İstediğin bölümden kendi dalını açıp hikâyeyi devam ettirebilirsin; ana hat özgün metin olarak kalır.")}{" "}
              {t("Kaynak:")}{" "}
              <a href={book.classic.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-dotted underline-offset-2 hover:text-accent">
                {book.classic.source}
              </a>{" "}
              · {t(book.classic.license)}
              {book.classic.coverCredit && <> · {t("Kapak:")} {t(book.classic.coverCredit)}</>}
            </p>
          )}
        </div>
      </section>

      {/* The writer's own tools, apart from what readers see. */}
      {isWriter && (
        <section className="mt-12 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("Yazar araçları")}</p>
            <Link href={`/book/${bookId}/board`} className={ghost}>
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-caramel" />
              {t("Mantar pano")}
            </Link>
            {isOwner && (
              <Link href={`/world/timeline?book=${bookId}`} className={ghost}>
                {t("Zaman çizelgesi")}
              </Link>
            )}
            {isOwner && !!openProposals && (
              <span className="rounded-full bg-caramel-soft px-3 py-2 text-sm">{t("{n} açık öneri", { n: openProposals })}</span>
            )}
            {isOwner && (
              <button type="button" onClick={() => setSettingsOpen((o) => !o)} aria-expanded={settingsOpen} className={`${ghost} ml-auto`}>
                {t("Ad, açıklama ve kapak")} <span aria-hidden="true">{settingsOpen ? "▴" : "▾"}</span>
              </button>
            )}
          </div>
          {isOwner && settingsOpen && (
            <div className="mt-5 grid gap-6 border-t border-border pt-5 sm:grid-cols-[1fr_auto]">
              <BookTitleEditor book={book} />
              <ImageUploader
                label={t("Kitap kapağı")}
                storageId={book.coverStorageId}
                onUploaded={(storageId) => void handleCoverUpload(storageId)}
              />
            </div>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-3 font-display text-2xl">{cfg.mapLabel}</h2>
        {chapters === undefined ? <Loading /> : <ChapterTree
            chapters={chapters}
            bookId={bookId}
            original={book.classic ? { ownerId: book.ownerId, author: book.classic.author } : undefined}
          />}
      </section>

      {entities && entities.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-2xl">{t("Evreni")}</h2>
          <div className="flex flex-col gap-5">
            {ENTITY_KIND_ORDER.filter((kind) => entities.some((e) => e.kind === kind)).map((kind) => (
              <div key={kind}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {entityKinds[kind].plural}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {entities
                    .filter((e) => e.kind === kind)
                    .map((entity) => (
                      <li key={entity._id}>
                        <Link
                          href={isOwner ? `/world/${entity._id}` : `/book/${bookId}/world/${entity._id}`}
                          title={entity.summary ?? undefined}
                          className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:border-border-hover hover:text-accent"
                        >
                          {entity.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entity.coverUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center">
                              <KindGlyph kind={entity.kind} />
                            </span>
                          )}
                          <span className="text-sm">{entity.name}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {isWriter && <CoAuthors bookId={bookId} />}

      {isOwner && (
        <div className="mt-12 border-t border-border pt-4">
          <DeleteButton
            target={{ kind: "book", id: bookId }}
            label={t("Bu yazıyı sil")}
            afterDelete={() => "/my-writing"}
          />
        </div>
      )}
    </main>
  );
}

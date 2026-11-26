"use client";

import { use, useEffect, useEffectEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SpeedReader from "@/components/SpeedReader";
import { useBookNames } from "@/lib/bookNames";
import { flowWords, type NameEntry } from "@/lib/editorExtensions";
import { readPref, writePref } from "@/lib/readingPrefs";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ChapterReader } from "@/components/Editor";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import CommentSection from "@/components/CommentSection";
import ReportButton from "@/components/ReportButton";
import Loading from "@/components/Loading";
import DeleteButton from "@/components/DeleteButton";
import NotFoundState from "@/components/NotFoundState";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { buttonLink, pillInactive } from "@/lib/ui";
import { isOpenToBranches } from "@/convex/writingKinds";
import { kindConfig } from "@/lib/writingKinds";
import { useCommunityOpen } from "@/lib/community";

const NO_NAMES: NameEntry[] = [];

export default function ChapterPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books">; chapterId: Id<"chapters"> }>;
}) {
  const { bookId, chapterId } = use(params);
  const chapter = useQuery(api.chapters.get, { chapterId });
  const children = useQuery(api.chapters.listChildren, {
    bookId,
    parentChapterId: chapterId,
  });
  const me = useQuery(api.users.me);
  const book = useQuery(api.books.get, { bookId });
  const markRead = useMutation(api.reading.markChapterRead);
  const markCanonical = useMutation(api.chapters.markCanonical);
  const showToast = useToast();
  const communityOpen = useCommunityOpen();
  const bookNames = useBookNames(bookId);
  const [bionic, setBionic] = useState(() => readPref("bionic", false));
  const [showNames, setShowNames] = useState(() => readPref("names", true));
  const [flowOpen, setFlowOpen] = useState(false);
  const content = chapter?.content ?? "";
  const words = useMemo(() => flowWords(content), [content]);
  const router = useRouter();
  const parent = useQuery(
    api.chapters.get,
    chapter?.parentChapterId ? { chapterId: chapter.parentChapterId } : "skip",
  );
  // The main line continues through the chosen child; the others are
  // branches.
  const next = children?.find((c) => c.isCanonical) ?? children?.[0];
  const branches = (children ?? []).filter((c) => c._id !== next?._id);
  const prevHref = parent ? `/kitap/${bookId}/bolum/${parent._id}` : null;
  const nextHref = next ? `/kitap/${bookId}/bolum/${next._id}` : null;

  // ← and → turn the page, as in an e-reader.
  const turnPage = useEffectEvent((event: KeyboardEvent) => {
    if (flowOpen || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, [contenteditable='true']")) return;
    if (event.key === "ArrowRight" && nextHref) router.push(nextHref);
    if (event.key === "ArrowLeft" && prevHref) router.push(prevHref);
  });
  useEffect(() => {
    window.addEventListener("keydown", turnPage);
    return () => window.removeEventListener("keydown", turnPage);
  }, []);

  function chooseBionic(value: boolean) {
    setBionic(value);
    writePref("bionic", value);
  }
  function chooseNames(value: boolean) {
    setShowNames(value);
    writePref("names", value);
  }

  useEffect(() => {
    if (chapter?.status === "published" && me) {
      void markRead({ chapterId });
    }
  }, [chapter?.status, me, chapterId, markRead]);

  if (chapter === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Loading />
      </main>
    );
  }
  if (chapter === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <NotFoundState title="Bu bölüm bulunamadı" />
      </main>
    );
  }

  const canBranch = me !== null && me !== undefined;
  const isAuthor = me?._id === chapter.authorId;
  const isBookOwner = me?._id === book?.ownerId;
  const cfg = kindConfig(book ?? {});
  const writeNextLabel = isBookOwner
    ? cfg.continueCta
    : communityOpen && book?.visibility === "public" && book && isOpenToBranches(book)
      ? cfg.branchCta
      : undefined;

  async function handleMarkCanonical(targetChapterId: Id<"chapters">) {
    try {
      await markCanonical({ chapterId: targetChapterId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/kitap/${bookId}`} className="text-sm text-muted">
        ← {cfg.mapLabel}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 mb-4">
        <h1 className="text-2xl font-semibold">{chapter.title}</h1>
        {isAuthor && (
          <Link
            href={`/kitap/${bookId}/bolum/${chapterId}/duzenle`}
            className={buttonLink}
          >
            Düzenle
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div
          role="group"
          aria-label="Okuma modu"
          className="inline-flex rounded-full border border-border p-0.5"
        >
          {[
            { value: false, label: "Normal" },
            { value: true, label: "Biyonik" },
          ].map((option) => (
            <button
              key={option.label}
              aria-pressed={bionic === option.value}
              onClick={() => chooseBionic(option.value)}
              title={
                option.value
                  ? "Kelimelerin başı kalın: göz kelimeyi daha hızlı tanır"
                  : undefined
              }
              className={`rounded-full px-3 py-1 transition-colors ${
                bionic === option.value
                  ? "bg-accent text-accent-contrast"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {option.value ? <><b>Biy</b>onik</> : option.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFlowOpen(true)}
          disabled={words.length === 0}
          title="Kelimeler tek tek, seçtiğin hızda akar"
          className={`${pillInactive} disabled:opacity-40`}
        >
          ▶ Akış ile oku
        </button>
        {bookNames.length > 0 && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-muted">
            <input
              type="checkbox"
              checked={showNames}
              onChange={(event) => chooseNames(event.target.checked)}
              className="accent-[var(--caramel)]"
            />
            Karakter ve mekanları vurgula
          </label>
        )}
        <span className="ml-auto text-xs text-muted tabular-nums">
          {words.length.toLocaleString("tr-TR")} kelime · ~
          {Math.max(1, Math.round(words.length / 220))} dk
        </span>
      </div>

      <ChapterReader
        key={chapterId}
        content={chapter.content}
        names={showNames ? bookNames : NO_NAMES}
        bionic={bionic}
      />

      {flowOpen && (
        <SpeedReader words={words} title={chapter.title} onClose={() => setFlowOpen(false)} />
      )}

      <div className="flex flex-wrap items-center gap-2 mt-6">
        {communityOpen && (
          <LikeButton
            targetType="chapter"
            targetId={chapterId}
            likeCount={chapter.likeCount}
          />
        )}
        <ShareButton
          targetType="chapter"
          targetId={chapterId}
          shareCount={chapter.shareCount}
        />
        {canBranch && writeNextLabel && (
          <Link
            href={`/kitap/${bookId}/bolum/${chapterId}/yaz`}
            className={pillInactive}
          >
            ✎ {writeNextLabel}
          </Link>
        )}
        {communityOpen && canBranch && !isAuthor && (
          <ReportButton targetType="chapter" targetId={chapterId} />
        )}
      </div>

      {/* Turning the page */}
      <nav aria-label="Bölümler arasında" className="mt-12 grid gap-3 sm:grid-cols-2">
        {prevHref && parent ? (
          <Link
            href={prevHref}
            className="group rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-border-hover"
          >
            <span className="text-xs text-muted">← Önceki</span>
            <span className="mt-1 block truncate font-display text-lg text-foreground group-hover:text-accent">
              {parent.title}
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {children === undefined ? null : next && nextHref ? (
          <Link
            href={nextHref}
            className="group rounded-xl border border-accent/30 bg-accent-soft/50 px-5 py-4 text-right transition-colors hover:border-accent"
          >
            <span className="text-xs text-accent">Sonraki →</span>
            <span className="mt-1 block truncate font-display text-lg text-foreground group-hover:text-accent">
              {next.title}
            </span>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-5 py-4 text-right">
            <span className="text-xs text-muted">Burada bitiyor</span>
            <span className="mt-1 block text-sm text-muted">
              {isBookOwner ? "Devamını yazmak sana kalmış." : "Henüz bir devamı yok."}
            </span>
          </div>
        )}
      </nav>
      {(prevHref || nextHref) && (
        <p className="mt-2 hidden text-center text-[11px] text-muted sm:block">
          ← → tuşlarıyla da sayfa çevirebilirsin
        </p>
      )}

      {branches.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Buradan ayrılan başka dallar
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {branches.map((child) => (
              <li key={child._id} className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/kitap/${bookId}/bolum/${child._id}`}
                  className="font-display text-lg text-foreground underline decoration-border-hover underline-offset-4 hover:text-accent"
                >
                  {child.title}
                </Link>
                {isBookOwner && (
                  <button
                    onClick={() => void handleMarkCanonical(child._id)}
                    className={buttonLink}
                  >
                    ana hat yap
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {communityOpen && <CommentSection targetType="chapter" targetId={chapterId} />}

      {(isAuthor || isBookOwner) && children?.length === 0 && (
        <div className="mt-12 border-t border-border pt-4">
          <DeleteButton
            target={{ kind: "chapter", id: chapterId }}
            label="Bu bölümü sil"
            afterDelete={({ parentChapterId }) =>
              parentChapterId
                ? `/kitap/${bookId}/bolum/${parentChapterId}`
                : `/kitap/${bookId}`
            }
          />
        </div>
      )}
    </main>
  );
}

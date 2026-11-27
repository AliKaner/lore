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
import { useKindConfig } from "@/lib/localized";
import { useI18n } from "@/lib/i18n";
import { ReadingTracker } from "@/components/Goals";
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
  const { t, num } = useI18n();
  const localizedCfg = useKindConfig(book);
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
  const prevHref = parent ? `/book/${bookId}/chapter/${parent._id}` : null;
  const nextHref = next ? `/book/${bookId}/chapter/${next._id}` : null;

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
        <NotFoundState title={t("Bu bölüm bulunamadı")} />
      </main>
    );
  }

  const canBranch = me !== null && me !== undefined;
  const isAuthor = me?._id === chapter.authorId;
  const isBookOwner = me?._id === book?.ownerId;
  const cfg = localizedCfg;
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
      <Link href={`/book/${bookId}`} className="text-sm text-muted">
        ← {cfg.mapLabel}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 mb-4">
        <h1 className="text-2xl font-semibold">{chapter.title}</h1>
        {isAuthor && (
          <Link
            href={`/book/${bookId}/chapter/${chapterId}/edit`}
            className={buttonLink}
          >
            {t("Düzenle")}
          </Link>
        )}
      </div>
      {isAuthor && (chapter.status === "draft" || book?.visibility === "private") && (
        <p className="-mt-2 mb-4 inline-flex items-center gap-2 rounded-full bg-caramel-soft px-3 py-1 text-xs text-foreground/80">
          <span className="h-1.5 w-1.5 rounded-full bg-caramel" aria-hidden="true" />
          {chapter.status === "draft"
            ? t("Taslak: bunu yalnızca sen görüyorsun")
            : t("Yazın gizli: bunu yalnızca sen görüyorsun")}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div
          role="group"
          aria-label={t("Okuma modu")}
          className="inline-flex rounded-full border border-border p-0.5"
        >
          {[
            { value: false, label: t("Normal") },
            { value: true, label: t("Biyonik") },
          ].map((option) => (
            <button
              key={option.label}
              aria-pressed={bionic === option.value}
              onClick={() => chooseBionic(option.value)}
              title={
                option.value
                  ? t("Kelimelerin başı kalın: göz kelimeyi daha hızlı tanır")
                  : undefined
              }
              className={`rounded-full px-3 py-1 transition-colors ${
                bionic === option.value
                  ? "bg-accent text-accent-contrast"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {option.value ? <><b>{t("Biy")}</b>{t("onik")}</> : option.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFlowOpen(true)}
          disabled={words.length === 0}
          title={t("Kelimeler tek tek, seçtiğin hızda akar")}
          className={`${pillInactive} disabled:opacity-40`}
        >
          ▶ {t("Akış ile oku")}
        </button>
        {bookNames.length > 0 && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-muted">
            <input
              type="checkbox"
              checked={showNames}
              onChange={(event) => chooseNames(event.target.checked)}
              className="accent-[var(--caramel)]"
            />
            {t("Evrendeki adları vurgula")}
          </label>
        )}
        <span className="ml-auto" />
        <ReadingTracker chapterId={chapterId} />
        <span className="text-xs text-muted tabular-nums">
          {t("{n} kelime", { n: num(words.length) })} · {t("~{n} dk", { n: Math.max(1, Math.round(words.length / 220)) })}
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
            href={`/book/${bookId}/chapter/${chapterId}/write`}
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
            <span className="text-xs text-muted">← {t("Önceki")}</span>
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
            <span className="text-xs text-accent">{t("Sonraki")} →</span>
            <span className="mt-1 block truncate font-display text-lg text-foreground group-hover:text-accent">
              {next.title}
            </span>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-5 py-4 text-right">
            <span className="text-xs text-muted">{t("Burada bitiyor")}</span>
            <span className="mt-1 block text-sm text-muted">
              {isBookOwner ? t("Devamını yazmak sana kalmış.") : t("Henüz bir devamı yok.")}
            </span>
          </div>
        )}
      </nav>
      {(prevHref || nextHref) && (
        <p className="mt-2 hidden text-center text-[11px] text-muted sm:block">
          {t("← → tuşlarıyla da sayfa çevirebilirsin")}
        </p>
      )}

      {branches.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("Buradan ayrılan başka dallar")}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {branches.map((child) => (
              <li key={child._id} className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/book/${bookId}/chapter/${child._id}`}
                  className="font-display text-lg text-foreground underline decoration-border-hover underline-offset-4 hover:text-accent"
                >
                  {child.title}
                </Link>
                {isBookOwner && (
                  <button
                    onClick={() => void handleMarkCanonical(child._id)}
                    className={buttonLink}
                  >
                    {t("ana hat yap")}
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
            label={t("Bu bölümü sil")}
            afterDelete={({ parentChapterId }) =>
              parentChapterId
                ? `/book/${bookId}/chapter/${parentChapterId}`
                : `/book/${bookId}`
            }
          />
        </div>
      )}
    </main>
  );
}

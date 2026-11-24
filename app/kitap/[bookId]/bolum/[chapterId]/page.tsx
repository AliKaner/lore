"use client";

import { use, useEffect } from "react";
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
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { buttonLink, pillInactive } from "@/lib/ui";
import { isOpenToBranches } from "@/convex/writingKinds";
import { kindConfig } from "@/lib/writingKinds";

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
    return <main className="mx-auto max-w-2xl px-4 py-10">Bölüm bulunamadı.</main>;
  }

  const canBranch = me !== null && me !== undefined;
  const isAuthor = me?._id === chapter.authorId;
  const isBookOwner = me?._id === book?.ownerId;
  const cfg = kindConfig(book ?? {});
  const writeNextLabel = isBookOwner
    ? cfg.continueCta
    : book?.visibility === "public" && book && isOpenToBranches(book)
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

      <ChapterReader content={chapter.content} />

      <div className="flex flex-wrap items-center gap-2 mt-6">
        <LikeButton
          targetType="chapter"
          targetId={chapterId}
          likeCount={chapter.likeCount}
        />
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
        {canBranch && !isAuthor && (
          <ReportButton targetType="chapter" targetId={chapterId} />
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-medium mb-2">Devamını oku</h2>
        {children === undefined ? (
          <Loading />
        ) : children.length === 0 ? (
          <p className="text-muted text-sm">
            Henüz bir devamı yok.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {children.map((child) => (
              <li key={child._id} className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/kitap/${bookId}/bolum/${child._id}`}
                  className="text-sm underline"
                >
                  {child.title}
                </Link>
                {child.isCanonical && (
                  <span className="text-xs text-muted">ana hat</span>
                )}
                {isBookOwner && !child.isCanonical && (
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
        )}
      </div>

      <CommentSection targetType="chapter" targetId={chapterId} />
    </main>
  );
}

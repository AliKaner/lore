"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isOpenToBranches } from "@/convex/writingKinds";
import ChapterForm from "@/components/ChapterForm";
import SignInPrompt from "@/components/SignInPrompt";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import NotFoundState from "@/components/NotFoundState";
import { buttonLink, buttonPrimary } from "@/lib/ui";
import { kindConfig } from "@/lib/writingKinds";

export default function NewBranchChapterPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books">; chapterId: Id<"chapters"> }>;
}) {
  const { bookId, chapterId } = use(params);
  const me = useQuery(api.users.me);
  const book = useQuery(api.books.get, { bookId });

  const isOwner = !!me && !!book && me._id === book.ownerId;
  const cfg = book ? kindConfig(book) : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/kitap/${bookId}/bolum/${chapterId}`} className={buttonLink}>
        ← Geri dön
      </Link>
      {me === undefined || book === undefined ? (
        <div className="mt-4">
          <Loading />
        </div>
      ) : me === null ? (
        <SignInPrompt title="Yazmaya başlamak için giriş yap" />
      ) : book === null || cfg === null ? (
        <NotFoundState />
      ) : isOwner ? (
        <>
          <h1 className="text-2xl font-semibold mt-2 mb-6">{cfg.continueCta}</h1>
          <ChapterForm bookId={bookId} parentChapterId={chapterId} kind={book.kind} />
        </>
      ) : isOpenToBranches(book) && cfg.branchCta ? (
        <>
          <h1 className="text-2xl font-semibold mt-2 mb-2">{cfg.branchCta}</h1>
          <p className="text-muted text-sm mb-6">{cfg.branchIntro}</p>
          <ChapterForm bookId={bookId} parentChapterId={chapterId} kind={book.kind} />
        </>
      ) : (
        <EmptyState
          art="locked"
          eyebrow={cfg.label}
          title="Bu yazıya yalnızca yazarı ekleme yapabilir"
          actions={
            <Link href={`/kitap/${bookId}/bolum/${chapterId}`} className={`${buttonPrimary} px-6`}>
              Okumaya dön
            </Link>
          }
        >
          <p>
            Kitap, öykü ve şiirde okurlar kendi dallarını yazabilir; {cfg.label.toLocaleLowerCase("tr-TR")}{" "}
            gibi türlerde metin yalnızca yazarına aittir.
          </p>
        </EmptyState>
      )}
    </main>
  );
}

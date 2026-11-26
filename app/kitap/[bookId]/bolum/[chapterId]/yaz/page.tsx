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
import { useKindConfig } from "@/lib/localized";
import { useT } from "@/lib/i18n";

export default function NewBranchChapterPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books">; chapterId: Id<"chapters"> }>;
}) {
  const { bookId, chapterId } = use(params);
  const me = useQuery(api.users.me);
  const book = useQuery(api.books.get, { bookId });

  const isOwner = !!me && !!book && me._id === book.ownerId;
  const t = useT();
  const localized = useKindConfig(book);
  const cfg = book ? localized : null;
  const backHref = `/kitap/${bookId}/bolum/${chapterId}`;

  if (me && book && cfg && (isOwner || (isOpenToBranches(book) && cfg.branchCta))) {
    return (
      <ChapterForm
        bookId={bookId}
        parentChapterId={chapterId}
        kind={book.kind}
        backHref={backHref}
        backLabel={t("Bölüme dön")}
        eyebrow={isOwner ? cfg.continueCta : cfg.branchCta}
        intro={isOwner ? undefined : cfg.branchIntro}
      />
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/kitap/${bookId}/bolum/${chapterId}`} className={buttonLink}>
        ← {t("Geri dön")}
      </Link>
      {me === undefined || book === undefined ? (
        <div className="mt-4">
          <Loading />
        </div>
      ) : me === null ? (
        <SignInPrompt title={t("Yazmaya başlamak için giriş yap")} />
      ) : book === null || cfg === null ? (
        <NotFoundState />
      ) : (
        <EmptyState
          art="locked"
          eyebrow={cfg.label}
          title={t("Bu yazıya yalnızca yazarı ekleme yapabilir")}
          actions={
            <Link href={`/kitap/${bookId}/bolum/${chapterId}`} className={`${buttonPrimary} px-6`}>
              {t("Okumaya dön")}
            </Link>
          }
        >
          <p>
            {t("Kitap, öykü ve şiirde okurlar kendi dallarını yazabilir; {kind} gibi türlerde metin yalnızca yazarına aittir.", { kind: cfg.label })}
          </p>
        </EmptyState>
      )}
    </main>
  );
}

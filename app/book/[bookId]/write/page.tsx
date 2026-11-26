"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ChapterForm from "@/components/ChapterForm";
import SignInPrompt from "@/components/SignInPrompt";
import Loading from "@/components/Loading";
import NotFoundState from "@/components/NotFoundState";
import { buttonLink } from "@/lib/ui";
import { useKindConfig } from "@/lib/localized";
import { useT } from "@/lib/i18n";

export default function NewRootChapterPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books"> }>;
}) {
  const { bookId } = use(params);
  const me = useQuery(api.users.me);
  const book = useQuery(api.books.get, { bookId });
  const t = useT();
  const cfg = useKindConfig(book);

  if (me && book) {
    return (
      <ChapterForm
        bookId={bookId}
        kind={book.kind}
        backHref={`/book/${bookId}`}
        backLabel={t("Yazıya dön")}
        eyebrow={cfg.firstUnitCta}
      />
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/book/${bookId}`} className={buttonLink}>
        ← {t("Yazıya dön")}
      </Link>
      {me === undefined || book === undefined ? (
        <div className="mt-4">
          <Loading />
        </div>
      ) : me === null ? (
        <SignInPrompt title={t("Yazmaya başlamak için giriş yap")} />
      ) : (
        <NotFoundState />
      )}
    </main>
  );
}

"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ChapterForm from "@/components/ChapterForm";
import SignInPrompt from "@/components/SignInPrompt";
import Loading from "@/components/Loading";
import DeleteButton from "@/components/DeleteButton";
import EmptyState from "@/components/EmptyState";
import NotFoundState from "@/components/NotFoundState";
import { buttonLink, buttonPrimary } from "@/lib/ui";
import { useT } from "@/lib/i18n";

export default function EditChapterPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books">; chapterId: Id<"chapters"> }>;
}) {
  const { bookId, chapterId } = use(params);
  const chapter = useQuery(api.chapters.get, { chapterId });
  const book = useQuery(api.books.get, { bookId });
  const me = useQuery(api.users.me);
  const t = useT();

  const backLink = (
    <Link href={`/kitap/${bookId}/bolum/${chapterId}`} className={buttonLink}>
      ← {t("Bölüme dön")}
    </Link>
  );

  if (chapter === undefined || me === undefined || book === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        {backLink}
        <div className="mt-4">
          <Loading />
        </div>
      </main>
    );
  }

  if (me === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        {backLink}
        <SignInPrompt title={t("Bu bölümü düzenlemek için giriş yap")} />
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

  if (chapter.authorId !== me._id) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        {backLink}
        <EmptyState
          art="locked"
          eyebrow={t("Düzenleme")}
          title={t("Bu bölümü yalnızca yazarı düzenleyebilir")}
          actions={
            <Link href={`/kitap/${bookId}/bolum/${chapterId}`} className={`${buttonPrimary} px-6`}>
              {t("Bölümü oku")}
            </Link>
          }
        >
          <p>
            {t("Bir şey eklemek istiyorsan, yazı okurlara açıksa bölümün altındaki düğmeyle kendi dalını yazabilirsin.")}
          </p>
        </EmptyState>
      </main>
    );
  }

  return (
    <ChapterForm
      key={chapter._id}
      bookId={bookId}
      existingChapter={chapter}
      kind={book?.kind}
      backHref={`/kitap/${bookId}/bolum/${chapterId}`}
      backLabel={t("Bölüme dön")}
      eyebrow={chapter.status === "draft" ? t("Taslak") : t("Yayında · düzenleniyor")}
      footer={
        <DeleteButton
          target={{ kind: "chapter", id: chapter._id }}
          label={t("Bu bölümü sil")}
          afterDelete={({ parentChapterId }) =>
            parentChapterId ? `/kitap/${bookId}/bolum/${parentChapterId}` : `/kitap/${bookId}`
          }
        />
      }
    />
  );
}

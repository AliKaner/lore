"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ChapterForm from "@/components/ChapterForm";
import SignInPrompt from "@/components/SignInPrompt";
import Loading from "@/components/Loading";
import { buttonLink } from "@/lib/ui";

export default function EditChapterPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books">; chapterId: Id<"chapters"> }>;
}) {
  const { bookId, chapterId } = use(params);
  const chapter = useQuery(api.chapters.get, { chapterId });
  const me = useQuery(api.users.me);

  const backLink = (
    <Link href={`/kitap/${bookId}/bolum/${chapterId}`} className={buttonLink}>
      ← Bölüme dön
    </Link>
  );

  if (chapter === undefined || me === undefined) {
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
        <div className="mt-4">
          <SignInPrompt message="Bu bölümü düzenlemek için giriş yapman gerekiyor." />
        </div>
      </main>
    );
  }

  if (chapter === null || chapter.authorId !== me._id) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        {backLink}
        <p className="text-muted text-sm mt-4">
          Bu bölümü düzenleyemezsin — sadece onu yazan kişi düzenleyebilir.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {backLink}
      <h1 className="text-2xl font-semibold mt-2 mb-6">Bölümü düzenle</h1>
      <ChapterForm bookId={bookId} existingChapter={chapter} />
    </main>
  );
}

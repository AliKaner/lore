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

export default function NewBranchChapterPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books">; chapterId: Id<"chapters"> }>;
}) {
  const { bookId, chapterId } = use(params);
  const me = useQuery(api.users.me);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/kitap/${bookId}/bolum/${chapterId}`} className={buttonLink}>
        ← Bölüme dön
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-2">Kendi hikayeni yaz</h1>
      <p className="text-muted text-sm mb-6">
        Bu bölümden devam eden, kendi yazdığın yeni bir hikaye kolu
        açıyorsun. Orijinal yazarın onayına gerek yok.
      </p>
      {me === undefined ? (
        <Loading />
      ) : me === null ? (
        <SignInPrompt message="Kendi hikayeni yazmaya başlamak için giriş yapman gerekiyor." />
      ) : (
        <ChapterForm bookId={bookId} parentChapterId={chapterId} />
      )}
    </main>
  );
}

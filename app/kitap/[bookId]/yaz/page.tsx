"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ChapterForm from "@/components/ChapterForm";
import BookTitleEditor from "@/components/BookTitleEditor";
import SignInPrompt from "@/components/SignInPrompt";
import Loading from "@/components/Loading";
import { buttonLink } from "@/lib/ui";

export default function NewRootChapterPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books"> }>;
}) {
  const { bookId } = use(params);
  const me = useQuery(api.users.me);
  const book = useQuery(api.books.get, { bookId });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href={`/kitap/${bookId}`} className={buttonLink}>
        ← Kitaba dön
      </Link>

      {me === undefined || book === undefined ? (
        <div className="mt-4">
          <Loading />
        </div>
      ) : me === null ? (
        <div className="mt-4">
          <SignInPrompt message="İlk bölümü yazmaya başlamak için giriş yapman gerekiyor." />
        </div>
      ) : book === null ? (
        <p className="text-muted text-sm mt-4">Kitap bulunamadı.</p>
      ) : (
        <>
          <div className="mt-4">
            <BookTitleEditor book={book} />
          </div>
          <h2 className="font-medium mb-3">İlk bölümü yaz</h2>
          <ChapterForm bookId={bookId} />
        </>
      )}
    </main>
  );
}

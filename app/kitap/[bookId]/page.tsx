"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ChapterTree from "@/components/ChapterTree";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import FavoriteButton from "@/components/FavoriteButton";
import BookCover from "@/components/BookCover";
import BookTitleEditor from "@/components/BookTitleEditor";
import ImageUploader from "@/components/ImageUploader";
import ReportButton from "@/components/ReportButton";
import Loading from "@/components/Loading";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { buttonPrimary } from "@/lib/ui";
import { kindConfig } from "@/lib/writingKinds";

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books"> }>;
}) {
  const { bookId } = use(params);
  const book = useQuery(api.books.get, { bookId });
  const chapters = useQuery(api.chapters.getTree, { bookId });
  const characters = useQuery(api.characters.listForBook, { bookId });
  const places = useQuery(api.places.listForBook, { bookId });
  const me = useQuery(api.users.me);
  const setBookCover = useMutation(api.files.setBookCover);
  const showToast = useToast();

  if (book === undefined) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Loading />
      </main>
    );
  }
  if (book === null) {
    return <main className="mx-auto max-w-3xl px-4 py-10">Bulunamadı.</main>;
  }

  async function handleCoverUpload(storageId: Id<"_storage">) {
    try {
      await setBookCover({ bookId, storageId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  const isOwner = me?._id === book.ownerId;
  const cfg = kindConfig(book);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">
        {cfg.label}
      </p>
      <div className="flex gap-4 mb-4">
        <BookCover
          storageId={book.coverStorageId}
          title={book.title}
          placeholder="kapak yok"
          className="h-32 w-24 rounded shrink-0"
        />
        <div className="flex-1 min-w-0">
          {isOwner ? (
            <BookTitleEditor book={book} />
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-1">{book.title}</h1>
              {book.description && (
                <p className="text-muted">{book.description}</p>
              )}
            </>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="mb-6">
          <ImageUploader
            label="Kitap kapağı"
            storageId={book.coverStorageId}
            onUploaded={(storageId) => void handleCoverUpload(storageId)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <LikeButton targetType="book" targetId={bookId} likeCount={book.likeCount} />
        <ShareButton targetType="book" targetId={bookId} shareCount={book.shareCount} />
        <FavoriteButton targetType="book" targetId={bookId} />
        {!isOwner && me && <ReportButton targetType="book" targetId={bookId} />}
      </div>

      {book.rootChapterId ? (
        <Link
          href={`/kitap/${bookId}/bolum/${book.rootChapterId}`}
          className={`${buttonPrimary} mb-6`}
        >
          Okumaya başla
        </Link>
      ) : isOwner ? (
        <Link href={`/kitap/${bookId}/yaz`} className={`${buttonPrimary} mb-6`}>
          {cfg.firstUnitCta}
        </Link>
      ) : (
        <p className="text-muted mb-6 text-sm">Henüz bir şey yazılmamış.</p>
      )}

      <h2 className="font-medium mb-2">{cfg.mapLabel}</h2>
      {chapters === undefined ? (
        <Loading />
      ) : (
        <ChapterTree chapters={chapters} bookId={bookId} />
      )}

      {((characters && characters.length > 0) || (places && places.length > 0)) && (
        <div className="mt-8 flex flex-col gap-6">
          {characters && characters.length > 0 && (
            <div>
              <h2 className="font-medium mb-2">Karakterler</h2>
              <ul className="flex flex-wrap gap-3">
                {characters.map((character) => (
                  <li
                    key={character._id}
                    className="flex items-center gap-2 border border-border rounded-full pl-1 pr-3 py-1"
                  >
                    <BookCover
                      storageId={character.imageStorageId}
                      title={character.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-sm">{character.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {places && places.length > 0 && (
            <div>
              <h2 className="font-medium mb-2">Mekanlar</h2>
              <ul className="flex flex-wrap gap-3">
                {places.map((place) => (
                  <li
                    key={place._id}
                    className="flex items-center gap-2 border border-border rounded-full pl-1 pr-3 py-1"
                  >
                    <BookCover
                      storageId={place.imageStorageId}
                      title={place.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-sm">{place.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

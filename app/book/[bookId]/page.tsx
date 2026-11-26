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
import DeleteButton from "@/components/DeleteButton";
import NotFoundState from "@/components/NotFoundState";
import ExportMenu from "@/components/ExportMenu";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { buttonPrimary } from "@/lib/ui";
import { useEntityKinds, useKindConfig } from "@/lib/localized";
import { useT } from "@/lib/i18n";
import { useCommunityOpen } from "@/lib/community";
import { ENTITY_KIND_ORDER } from "@/convex/entityKinds";
import { KindGlyph } from "@/components/entity/shared";

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books"> }>;
}) {
  const { bookId } = use(params);
  const book = useQuery(api.books.get, { bookId });
  const chapters = useQuery(api.chapters.getTree, { bookId });
  const entities = useQuery(api.entities.listForBook, { bookId });
  const me = useQuery(api.users.me);
  const setBookCover = useMutation(api.files.setBookCover);
  const showToast = useToast();
  const communityOpen = useCommunityOpen();
  const t = useT();
  const cfg = useKindConfig(book);
  const entityKinds = useEntityKinds();

  if (book === undefined) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Loading />
      </main>
    );
  }
  if (book === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <NotFoundState />
      </main>
    );
  }

  async function handleCoverUpload(storageId: Id<"_storage">) {
    try {
      await setBookCover({ bookId, storageId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  const isOwner = me?._id === book.ownerId;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">
        {cfg.label}
      </p>
      <div className="flex gap-4 mb-4">
        <BookCover
          storageId={book.coverStorageId}
          title={book.title}
          placeholder={t("kapak yok")}
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
            label={t("Kitap kapağı")}
            storageId={book.coverStorageId}
            onUploaded={(storageId) => void handleCoverUpload(storageId)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {communityOpen && (
          <LikeButton targetType="book" targetId={bookId} likeCount={book.likeCount} />
        )}
        <ShareButton targetType="book" targetId={bookId} shareCount={book.shareCount} />
        {isOwner && <ExportMenu bookId={bookId} />}
        {communityOpen && <FavoriteButton targetType="book" targetId={bookId} />}
        {communityOpen && !isOwner && me && (
          <ReportButton targetType="book" targetId={bookId} />
        )}
      </div>

      {book.rootChapterId ? (
        <Link
          href={`/book/${bookId}/chapter/${book.rootChapterId}`}
          className={`${buttonPrimary} mb-6`}
        >
          {t("Okumaya başla")}
        </Link>
      ) : isOwner ? (
        <Link href={`/book/${bookId}/write`} className={`${buttonPrimary} mb-6`}>
          {cfg.firstUnitCta}
        </Link>
      ) : (
        <p className="text-muted mb-6 text-sm">{t("Henüz bir şey yazılmamış.")}</p>
      )}

      <h2 className="font-medium mb-2">{cfg.mapLabel}</h2>
      {chapters === undefined ? (
        <Loading />
      ) : (
        <ChapterTree chapters={chapters} bookId={bookId} />
      )}

      {entities && entities.length > 0 && (
        <section className="mt-10">
          <h2 className="font-medium mb-3">{t("Evreni")}</h2>
          <div className="flex flex-col gap-5">
            {ENTITY_KIND_ORDER.filter((kind) => entities.some((e) => e.kind === kind)).map((kind) => (
              <div key={kind}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {entityKinds[kind].plural}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {entities
                    .filter((e) => e.kind === kind)
                    .map((entity) => (
                      <li key={entity._id}>
                        <Link
                          href={isOwner ? `/world/${entity._id}` : `/book/${bookId}/world/${entity._id}`}
                          title={entity.summary ?? undefined}
                          className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 transition-colors hover:border-border-hover hover:text-accent"
                        >
                          {entity.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entity.coverUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center">
                              <KindGlyph kind={entity.kind} />
                            </span>
                          )}
                          <span className="text-sm">{entity.name}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {isOwner && (
        <div className="mt-12 border-t border-border pt-4">
          <DeleteButton
            target={{ kind: "book", id: bookId }}
            label={t("Bu yazıyı sil")}
            afterDelete={() => "/my-writing"}
          />
        </div>
      )}
    </main>
  );
}

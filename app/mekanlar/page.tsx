"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ImageUploader from "@/components/ImageUploader";
import FavoriteButton from "@/components/FavoriteButton";
import { useCommunityOpen } from "@/lib/community";
import SignInPrompt from "@/components/SignInPrompt";
import Loading from "@/components/Loading";
import DeleteButton from "@/components/DeleteButton";
import EmptyState from "@/components/EmptyState";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import {
  buttonPrimary,
  buttonSecondary,
  card,
  cardList,
  inputBase,
} from "@/lib/ui";

export default function PlacesPage() {
  const me = useQuery(api.users.me);
  const communityOpen = useCommunityOpen();
  const places = useQuery(api.places.listMine, me ? {} : "skip");
  const myBooks = useQuery(api.books.listMine, me ? {} : "skip");
  const createPlace = useMutation(api.places.create);
  const attachToBook = useMutation(api.places.attachToBook);
  const setPlaceImage = useMutation(api.files.setPlaceImage);
  const showToast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attachBookId, setAttachBookId] = useState<Record<string, string>>({});

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length === 0) return;
    setSubmitting(true);
    try {
      await createPlace({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
    } catch (err) {
      showToast(toastErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAttach(placeId: Id<"places">) {
    const bookId = attachBookId[placeId];
    if (!bookId) return;
    try {
      await attachToBook({ bookId: bookId as Id<"books">, placeId });
      showToast("Kitaba eklendi.", "success");
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Mekanlar</h1>
      <p className="text-muted text-sm mb-6">
        Hikayelerindeki mekanları bir kere oluştur, istediğin kitaba paket
        gibi dahil et.
      </p>

      {me === undefined ? (
        <Loading />
      ) : me === null ? (
        <SignInPrompt title="Mekan oluşturmak için giriş yap" />
      ) : (
        <>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-10">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Mekan adı"
              className={inputBase}
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Kısa açıklama"
              rows={2}
              className={inputBase}
            />
            <button disabled={submitting} className={`${buttonPrimary} self-start`}>
              {submitting ? "Oluşturuluyor…" : "Mekan oluştur"}
            </button>
          </form>

          {places === undefined ? (
            <Loading />
          ) : places.length === 0 ? (
            <EmptyState compact art="blank" title="Henüz bir mekanın yok">
              <p>
                Yukarıdan oluştur ya da yazarken bir yer adını seçip “+ Mekan”a
                bas. Bir yazıya eklediğin mekanın adı metinde vurgulanır.
              </p>
            </EmptyState>
          ) : (
            <ul className={cardList}>
              {places.map((place) => (
                <li key={place._id} className={card}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-medium">{place.name}</h2>
                      {place.description && (
                        <p className="text-muted text-sm">{place.description}</p>
                      )}
                    </div>
                    {communityOpen && (
                      <FavoriteButton targetType="place" targetId={place._id} />
                    )}
                  </div>

                  <div className="mt-3">
                    <ImageUploader
                      label="Görsel"
                      storageId={place.imageStorageId}
                      onUploaded={(storageId) =>
                        void setPlaceImage({ placeId: place._id, storageId })
                      }
                    />
                  </div>

                  {myBooks && myBooks.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={attachBookId[place._id] ?? ""}
                        onChange={(event) =>
                          setAttachBookId((prev) => ({
                            ...prev,
                            [place._id]: event.target.value,
                          }))
                        }
                        className="min-w-0 flex-1 border border-border rounded px-2 py-1 text-sm"
                      >
                        <option value="">Bir kitap seç…</option>
                        {myBooks.map((book) => (
                          <option key={book._id} value={book._id}>
                            {book.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => void handleAttach(place._id)}
                        className={buttonSecondary}
                      >
                        Kitaba dahil et
                      </button>
                    </div>
                  )}

                  <div className="mt-4">
                    <DeleteButton
                      target={{ kind: "place", id: place._id }}
                      label="Mekanı sil"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

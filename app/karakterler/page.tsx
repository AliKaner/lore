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
import { toastErrorMessage, useToast } from "@/components/Toaster";
import {
  buttonPrimary,
  buttonSecondary,
  card,
  cardList,
  inputBase,
} from "@/lib/ui";

export default function CharactersPage() {
  const me = useQuery(api.users.me);
  const communityOpen = useCommunityOpen();
  const characters = useQuery(api.characters.listMine, me ? {} : "skip");
  const myBooks = useQuery(api.books.listMine, me ? {} : "skip");
  const createCharacter = useMutation(api.characters.create);
  const attachToBook = useMutation(api.characters.attachToBook);
  const setCharacterImage = useMutation(api.files.setCharacterImage);
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
      await createCharacter({
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

  async function handleAttach(characterId: Id<"characters">) {
    const bookId = attachBookId[characterId];
    if (!bookId) return;
    try {
      await attachToBook({ bookId: bookId as Id<"books">, characterId });
      showToast("Kitaba eklendi.", "success");
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Karakterler</h1>
      <p className="text-muted text-sm mb-6">
        Karakterlerini bir kere oluştur, sonra istediğin kitaba paket gibi
        dahil et.
      </p>

      {me === undefined ? (
        <Loading />
      ) : me === null ? (
        <SignInPrompt message="Karakter oluşturmak için giriş yapman gerekiyor." />
      ) : (
        <>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-10">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Karakter adı"
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
              {submitting ? "Oluşturuluyor…" : "Karakter oluştur"}
            </button>
          </form>

          {characters === undefined ? (
            <Loading />
          ) : characters.length === 0 ? (
            <p className="text-muted text-sm">Henüz karakter oluşturmadın.</p>
          ) : (
            <ul className={cardList}>
              {characters.map((character) => (
                <li key={character._id} className={card}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-medium">{character.name}</h2>
                      {character.description && (
                        <p className="text-muted text-sm">
                          {character.description}
                        </p>
                      )}
                    </div>
                    {communityOpen && (
                      <FavoriteButton targetType="character" targetId={character._id} />
                    )}
                  </div>

                  <div className="mt-3">
                    <ImageUploader
                      label="Görsel"
                      storageId={character.imageStorageId}
                      onUploaded={(storageId) =>
                        void setCharacterImage({
                          characterId: character._id,
                          storageId,
                        })
                      }
                    />
                  </div>

                  {myBooks && myBooks.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={attachBookId[character._id] ?? ""}
                        onChange={(event) =>
                          setAttachBookId((prev) => ({
                            ...prev,
                            [character._id]: event.target.value,
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
                        onClick={() => void handleAttach(character._id)}
                        className={buttonSecondary}
                      >
                        Kitaba dahil et
                      </button>
                    </div>
                  )}

                  <div className="mt-4">
                    <DeleteButton
                      target={{ kind: "character", id: character._id }}
                      label="Karakteri sil"
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

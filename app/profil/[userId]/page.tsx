"use client";

import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ImageUploader from "@/components/ImageUploader";
import BookCover from "@/components/BookCover";
import Loading from "@/components/Loading";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { levelInfo } from "@/lib/levels";
import { buttonPrimary, inputBase } from "@/lib/ui";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ userId: Id<"users"> }>;
}) {
  const { userId } = use(params);
  const profile = useQuery(api.users.publicProfile, { userId });
  const me = useQuery(api.users.me);
  const updateProfile = useMutation(api.users.updateProfile);
  const setAvatar = useMutation(api.files.setAvatar);
  const setWallpaper = useMutation(api.files.setWallpaper);
  const myFavoriteBooks = useQuery(
    api.social.listMyFavorites,
    me?._id === userId ? { targetType: "book" } : "skip",
  );
  const showToast = useToast();

  const isOwnProfile = me?._id === userId;
  const [bio, setBio] = useState<string | null>(null);
  const [savingBio, setSavingBio] = useState(false);

  if (profile === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Loading />
      </main>
    );
  }
  if (profile === null) {
    return <main className="mx-auto max-w-2xl px-4 py-10">Kullanıcı bulunamadı.</main>;
  }

  async function handleSaveBio(event: React.FormEvent) {
    event.preventDefault();
    setSavingBio(true);
    try {
      await updateProfile({ bio: bio ?? profile!.bio ?? "" });
      showToast("Kaydedildi.", "success");
    } catch (err) {
      showToast(toastErrorMessage(err));
    } finally {
      setSavingBio(false);
    }
  }

  async function handleSetAvatar(storageId: Id<"_storage">) {
    try {
      await setAvatar({ storageId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  async function handleSetWallpaper(storageId: Id<"_storage">) {
    try {
      await setWallpaper({ storageId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  const { badge, title, progressPercent } = levelInfo(profile.level, profile.xp);

  return (
    <main className="mx-auto max-w-2xl">
      <div className="relative h-40 bg-border">
        <BookCover
          storageId={profile.wallpaperStorageId}
          title="Duvar kağıdı"
          className="h-40 w-full"
        />
        <BookCover
          storageId={profile.avatarStorageId}
          title={profile.username ?? "Yazar"}
          placeholder="pp"
          className="absolute -bottom-8 left-4 h-20 w-20 rounded-full border-4 border-white"
        />
      </div>

      <div className="px-4 pt-12 pb-10">
        <h1 className="text-2xl font-semibold mb-1">
          {profile.username ?? "Yazar"}
        </h1>
        <p className="text-muted mb-1">
          {badge} {title} · Seviye {profile.level}
        </p>
        <div className="w-48 h-1.5 bg-border rounded-full mb-4">
          <div
            className="h-1.5 bg-foreground rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isOwnProfile ? (
          <form onSubmit={handleSaveBio} className="flex flex-col gap-2 mb-6">
            <textarea
              value={bio ?? profile.bio ?? ""}
              onChange={(event) => setBio(event.target.value)}
              rows={3}
              className={`${inputBase} text-sm`}
              placeholder="Kendinden bahset…"
            />
            <button disabled={savingBio} className={`${buttonPrimary} self-start`}>
              {savingBio ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </form>
        ) : (
          profile.bio && <p className="text-foreground mb-6">{profile.bio}</p>
        )}

        {isOwnProfile && (
          <div className="flex flex-col gap-4 mb-8">
            <ImageUploader
              label="Profil fotoğrafı"
              storageId={profile.avatarStorageId}
              onUploaded={(storageId) => void handleSetAvatar(storageId)}
            />
            <ImageUploader
              label="Duvar kağıdı"
              storageId={profile.wallpaperStorageId}
              onUploaded={(storageId) => void handleSetWallpaper(storageId)}
            />
          </div>
        )}

        {isOwnProfile && myFavoriteBooks && myFavoriteBooks.length > 0 && (
          <div>
            <h2 className="font-medium mb-2">Favori kitaplarım</h2>
            <p className="text-muted text-sm">
              {myFavoriteBooks.length} favori kitap
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

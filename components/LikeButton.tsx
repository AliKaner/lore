"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { pillBase, pillInactive } from "@/lib/ui";
import { toastErrorMessage, useToast } from "@/components/Toaster";

export default function LikeButton({
  targetType,
  targetId,
  likeCount,
}: {
  targetType: "book" | "chapter";
  targetId: string;
  likeCount: number;
}) {
  const liked = useQuery(api.social.hasLiked, { targetType, targetId });
  const showToast = useToast();
  const toggleLike = useMutation(api.social.toggleLike).withOptimisticUpdate(
    (localStore, args) => {
      const wasLiked =
        localStore.getQuery(api.social.hasLiked, {
          targetType: args.targetType,
          targetId: args.targetId,
        }) ?? false;
      localStore.setQuery(
        api.social.hasLiked,
        { targetType: args.targetType, targetId: args.targetId },
        !wasLiked,
      );
      const delta = wasLiked ? -1 : 1;
      if (args.targetType === "chapter") {
        const chapterId = args.targetId as Id<"chapters">;
        const chapter = localStore.getQuery(api.chapters.get, { chapterId });
        if (chapter) {
          localStore.setQuery(api.chapters.get, { chapterId }, {
            ...chapter,
            likeCount: chapter.likeCount + delta,
          });
        }
      } else {
        const bookId = args.targetId as Id<"books">;
        const book = localStore.getQuery(api.books.get, { bookId });
        if (book) {
          localStore.setQuery(api.books.get, { bookId }, {
            ...book,
            likeCount: book.likeCount + delta,
          });
        }
      }
    },
  );

  async function handleClick() {
    try {
      await toggleLike({ targetType, targetId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  return (
    <button
      onClick={() => void handleClick()}
      className={
        liked ? `${pillBase} border-rose-600 bg-rose-600 text-white` : pillInactive
      }
    >
      ♥ {likeCount}
    </button>
  );
}

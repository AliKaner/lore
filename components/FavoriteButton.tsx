"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { pillBase, pillInactive } from "@/lib/ui";
import { toastErrorMessage, useToast } from "@/components/Toaster";

export default function FavoriteButton({
  targetType,
  targetId,
}: {
  targetType: "book" | "character" | "place";
  targetId: string;
}) {
  const favorites = useQuery(api.social.listMyFavorites, { targetType });
  const showToast = useToast();
  const toggleFavorite = useMutation(
    api.social.toggleFavorite,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.social.listMyFavorites, {
      targetType: args.targetType,
    });
    if (current === undefined) return;
    const alreadyFavorited = current.some((f) => f.targetId === args.targetId);
    const next = alreadyFavorited
      ? current.filter((f) => f.targetId !== args.targetId)
      : [
          ...current,
          {
            _id: `optimistic:${args.targetId}` as Id<"favorites">,
            _creationTime: Date.now(),
            userId: "" as Id<"users">,
            targetType: args.targetType,
            targetId: args.targetId,
            createdAt: Date.now(),
          },
        ];
    localStore.setQuery(
      api.social.listMyFavorites,
      { targetType: args.targetType },
      next,
    );
  });
  const isFavorited =
    favorites?.some((f) => f.targetId === targetId) ?? false;

  async function handleClick() {
    try {
      await toggleFavorite({ targetType, targetId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  return (
    <button
      onClick={() => void handleClick()}
      className={
        isFavorited
          ? `${pillBase} border-amber-500 bg-amber-500 text-white`
          : pillInactive
      }
    >
      {isFavorited ? "★ Favoride" : "☆ Favorile"}
    </button>
  );
}

"use client";

import { useMutation, useQuery } from "convex/react";
import type { OptimisticUpdate } from "convex/browser";
import type { FunctionArgs } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { pillBase, pillInactive } from "@/lib/ui";
import { toastErrorMessage, useToast } from "@/components/Toaster";

// Shows the change at once; Convex replaces it with the server's answer.
// Lives outside the component: it runs when the mutation is called, not
// while rendering.
const optimisticToggle: OptimisticUpdate<FunctionArgs<typeof api.social.toggleFavorite>> = (
  localStore,
  args,
) => {
  const current = localStore.getQuery(api.social.listMyFavorites, {
    targetType: args.targetType,
  });
  if (current === undefined) return;
  const alreadyFavorited = current.some((f) => f.targetId === args.targetId);
  const now = Date.now();
  const next = alreadyFavorited
    ? current.filter((f) => f.targetId !== args.targetId)
    : [
        ...current,
        {
          _id: `optimistic:${args.targetId}` as Id<"favorites">,
          _creationTime: now,
          userId: "" as Id<"users">,
          targetType: args.targetType,
          targetId: args.targetId,
          createdAt: now,
        },
      ];
  localStore.setQuery(api.social.listMyFavorites, { targetType: args.targetType }, next);
};

export default function FavoriteButton({
  targetType,
  targetId,
}: {
  targetType: "book" | "entity";
  targetId: string;
}) {
  const favorites = useQuery(api.social.listMyFavorites, { targetType });
  const showToast = useToast();
  const toggleFavorite = useMutation(api.social.toggleFavorite).withOptimisticUpdate(
    optimisticToggle,
  );
  const isFavorited = favorites?.some((f) => f.targetId === targetId) ?? false;

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
        isFavorited ? `${pillBase} border-amber-500 bg-amber-500 text-white` : pillInactive
      }
    >
      {isFavorited ? "★ Favoride" : "☆ Favorile"}
    </button>
  );
}

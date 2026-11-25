"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { NameEntry } from "@/lib/editorExtensions";

// The characters and places attached to a writing, in the shape the editor
// and reader use to highlight them.
export function useBookNames(bookId: Id<"books">): NameEntry[] {
  const characters = useQuery(api.characters.listForBook, { bookId });
  const places = useQuery(api.places.listForBook, { bookId });
  return useMemo(
    () => [
      ...(characters ?? []).map((c) => ({
        name: c.name,
        kind: "character" as const,
        detail: c.description,
      })),
      ...(places ?? []).map((p) => ({
        name: p.name,
        kind: "place" as const,
        detail: p.description,
      })),
    ],
    [characters, places],
  );
}

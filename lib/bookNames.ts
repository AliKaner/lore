"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ENTITY_KINDS } from "@/convex/entityKinds";
import type { NameEntry } from "@/lib/editorExtensions";

// The named things of a writing (characters, places, countries…), in the
// shape the editor and reader use to highlight them.
export function useBookNames(bookId: Id<"books">): NameEntry[] {
  const entities = useQuery(api.entities.listForBook, { bookId });
  return useMemo(
    () =>
      (entities ?? []).map((entity) => ({
        id: entity._id,
        name: entity.name,
        kind: entity.kind,
        detail: entity.summary
          ? `${ENTITY_KINDS[entity.kind].label} · ${entity.summary}`
          : ENTITY_KINDS[entity.kind].label,
      })),
    [entities],
  );
}

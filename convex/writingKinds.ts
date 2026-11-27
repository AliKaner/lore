import { v, type Infer } from "convex/values";

// The language a writing is written in: picks the word list for completion.
export const bookLanguageValidator = v.union(v.literal("tr"), v.literal("en"));
export type BookLanguage = Infer<typeof bookLanguageValidator>;

export const writingKindValidator = v.union(
  v.literal("book"),
  v.literal("story"),
  v.literal("poetry"),
  v.literal("essay"),
  v.literal("column"),
  v.literal("interview"),
  v.literal("journal"),
  v.literal("diary"),
);

export type WritingKind = Infer<typeof writingKindValidator>;

// Fiction and poetry invite readers to write their own branches (a poem's
// branch is a "nazire"); non-fiction and personal writing stay single-author.
const OPEN_TO_BRANCHES: Record<WritingKind, boolean> = {
  book: true,
  story: true,
  poetry: true,
  essay: false,
  column: false,
  interview: false,
  journal: false,
  diary: false,
};

// Books created before writing kinds existed have no `kind`; they are books.
export function kindOf(book: { kind?: WritingKind }): WritingKind {
  return book.kind ?? "book";
}

export function isOpenToBranches(book: { kind?: WritingKind }): boolean {
  return OPEN_TO_BRANCHES[kindOf(book)];
}

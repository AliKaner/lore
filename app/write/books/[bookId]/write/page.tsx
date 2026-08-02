"use client";
import React, { use } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useWriterAuth } from "@/hooks/useWriterAuth";
import { ChapterStudio } from "@/components/ChapterStudio";

export default function WriteBookStudioPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const { token, loaded } = useWriterAuth();

  if (!loaded || !token) return null;

  return (
    <ChapterStudio
      bookId={bookId === "new" ? "new" : (bookId as Id<"books">)}
      auth={{ kind: "writer", writerToken: token }}
      exitHref="/write"
    />
  );
}

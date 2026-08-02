"use client";
import React, { use } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ChapterStudio } from "@/components/ChapterStudio";

export default function AdminBookStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ chapterId?: string }>;
}) {
  const { bookId } = use(params);
  const { chapterId } = use(searchParams);
  const { token, loaded } = useAdminAuth();

  if (!loaded || !token) return null;

  return (
    <ChapterStudio
      bookId={bookId === "new" ? "new" : (bookId as Id<"books">)}
      auth={{ kind: "admin", sessionToken: token }}
      exitHref="/admin/chapters"
      initialChapterId={chapterId as Id<"chapters"> | undefined}
    />
  );
}

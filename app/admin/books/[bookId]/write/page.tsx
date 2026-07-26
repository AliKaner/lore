"use client";
import React, { use } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ChapterStudio } from "@/components/ChapterStudio";

export default function AdminBookStudioPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const { token, loaded } = useAdminAuth();

  if (!loaded || !token) return null;

  return (
    <ChapterStudio
      bookId={bookId as Id<"books">}
      auth={{ kind: "admin", sessionToken: token }}
      exitHref="/admin/chapters"
    />
  );
}

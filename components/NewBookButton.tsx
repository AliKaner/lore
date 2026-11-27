"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { WritingKind } from "@/convex/writingKinds";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useI18n } from "@/lib/i18n";
import { useWritingKinds } from "@/lib/localized";

export default function NewBookButton({
  className,
  children,
  kind = "book",
}: {
  className?: string;
  children: ReactNode;
  kind?: WritingKind;
}) {
  const me = useQuery(api.users.me);
  const createBook = useMutation(api.books.create);
  const router = useRouter();
  const showToast = useToast();
  const kinds = useWritingKinds();
  const { t, locale } = useI18n();
  const [creating, setCreating] = useState(false);

  async function handleClick() {
    if (me === null) {
      router.push("/sign-in");
      return;
    }
    if (me === undefined || creating) return;
    setCreating(true);
    try {
      const bookId = await createBook({
        title: kinds[kind].untitled,
        kind,
        // Written in the language the writer uses the site in, until changed.
        language: locale,
        visibility: "private",
      });
      router.push(`/book/${bookId}/write`);
    } catch (err) {
      showToast(toastErrorMessage(err));
      setCreating(false);
    }
  }

  return (
    <button onClick={() => void handleClick()} disabled={creating} className={className}>
      {creating ? t("Oluşturuluyor…") : children}
    </button>
  );
}

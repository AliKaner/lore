"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { WritingKind } from "@/convex/writingKinds";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useT } from "@/lib/i18n";
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
  const t = useT();
  const [creating, setCreating] = useState(false);

  async function handleClick() {
    if (me === null) {
      router.push("/giris");
      return;
    }
    if (me === undefined || creating) return;
    setCreating(true);
    try {
      const bookId = await createBook({
        title: kinds[kind].untitled,
        kind,
        visibility: "private",
      });
      router.push(`/kitap/${bookId}/yaz`);
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

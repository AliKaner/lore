"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toastErrorMessage, useToast } from "@/components/Toaster";

export default function NewBookButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const me = useQuery(api.users.me);
  const createBook = useMutation(api.books.create);
  const router = useRouter();
  const showToast = useToast();
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
        title: "Başlıksız hikaye",
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
      {creating ? "Oluşturuluyor…" : children}
    </button>
  );
}

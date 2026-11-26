"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useT } from "@/lib/i18n";

type Target =
  | { kind: "book"; id: Id<"books"> }
  | { kind: "chapter"; id: Id<"chapters"> }
  | { kind: "entity"; id: Id<"entities"> };

const WARNING: Record<Target["kind"], string> = {
  book: "Yazı, içindeki bütün bölümlerle birlikte kalıcı olarak silinecek.",
  chapter: "Bu bölüm kalıcı olarak silinecek.",
  entity: "Kayıt, görselleri ve bağlantılarıyla birlikte bütün yazılardan çıkarılıp kalıcı olarak silinecek.",
};

// Deleting is permanent, so it takes two clicks: the first only asks.
export default function DeleteButton({
  target,
  label,
  afterDelete,
  onDeleted,
}: {
  target: Target;
  label: string;
  afterDelete?: (result: { parentChapterId: Id<"chapters"> | null }) => string;
  onDeleted?: () => void;
}) {
  const removeBook = useMutation(api.books.remove);
  const removeChapter = useMutation(api.chapters.remove);
  const removeEntity = useMutation(api.entities.remove);
  const router = useRouter();
  const showToast = useToast();
  const t = useT();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      let parentChapterId: Id<"chapters"> | null = null;
      if (target.kind === "book") await removeBook({ bookId: target.id });
      else if (target.kind === "chapter") {
        ({ parentChapterId } = await removeChapter({ chapterId: target.id }));
      } else await removeEntity({ entityId: target.id });
      showToast(t("Silindi."), "success");
      if (onDeleted) onDeleted();
      else if (afterDelete) router.push(afterDelete({ parentChapterId }));
      else setAsking(false);
    } catch (err) {
      showToast(toastErrorMessage(err));
      setAsking(false);
    } finally {
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <button
        onClick={() => setAsking(true)}
        className="text-sm text-muted underline decoration-dotted underline-offset-4 hover:text-red-700"
      >
        {label}
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={label}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
    >
      <span className="flex-1 min-w-[12rem]">{t(WARNING[target.kind])} {t("Geri alınamaz.")}</span>
      <button
        onClick={() => void handleDelete()}
        disabled={busy}
        autoFocus
        className="rounded-sm bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800 disabled:opacity-50"
      >
        {busy ? t("Siliniyor…") : t("Evet, sil")}
      </button>
      <button onClick={() => setAsking(false)} disabled={busy} className="underline">
        {t("Vazgeç")}
      </button>
    </div>
  );
}

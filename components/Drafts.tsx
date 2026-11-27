"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useI18n } from "@/lib/i18n";
import { timeAgo, useNow } from "@/lib/useNow";

// Puts a draft chapter out for readers, from wherever the writer sees it.
export function PublishDraftButton({
  chapterId,
  bookPrivate,
  className,
}: {
  chapterId: Id<"chapters">;
  bookPrivate: boolean;
  className?: string;
}) {
  const update = useMutation(api.chapters.update);
  const showToast = useToast();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true);
    try {
      await update({ chapterId, status: "published" });
      showToast(
        bookPrivate ? t("Yayınlandı. Yazın gizli olduğu için okurlar yine de göremez.") : t("Yayınlandı."),
        "success",
      );
    } catch (err) {
      showToast(toastErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void publish()}
      disabled={busy}
      className={
        className ??
        "rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-contrast hover:bg-accent-hover disabled:opacity-50"
      }
    >
      {busy ? t("Yayınlanıyor…") : t("Yayınla")}
    </button>
  );
}

// The desk's list of unpublished chapters: where each is, how long, when it
// was last touched; carry on writing it or publish it right here.
export default function Drafts() {
  const drafts = useQuery(api.chapters.myDrafts);
  const { t, num, locale } = useI18n();
  const now = useNow();
  if (!drafts || drafts.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {t("Taslakların")} <span className="ml-1 tabular-nums text-muted/70">{num(drafts.length)}</span>
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {drafts.map((draft) => (
          <li key={draft._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
            <Link href={`/book/${draft.bookId}/chapter/${draft._id}/edit`} className="min-w-0 flex-1">
              <p className="truncate font-medium hover:text-accent">{draft.title || t("Adsız bölüm")}</p>
              <p className="truncate text-xs text-muted">
                {draft.bookTitle} · {t("{n} kelime", { n: num(draft.words) })}
                {now > 0 && <> · {timeAgo(draft.updatedAt, now, locale)}</>}
                {draft.bookPrivate && <> · {t("gizli yazı")}</>}
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href={`/book/${draft.bookId}/chapter/${draft._id}/edit`}
                className="rounded-full px-3 py-1 text-xs text-muted hover:bg-accent-soft/60 hover:text-foreground"
              >
                {t("Düzenle")}
              </Link>
              <PublishDraftButton chapterId={draft._id} bookPrivate={draft.bookPrivate} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

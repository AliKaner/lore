"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { buttonLink, buttonPrimary, inputBase } from "@/lib/ui";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import Loading from "@/components/Loading";
import { intlLocale, useI18n } from "@/lib/i18n";
import type { Id } from "@/convex/_generated/dataModel";

export default function CommentSection({
  targetType,
  targetId,
}: {
  targetType: "book" | "chapter";
  targetId: string;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.social.listComments,
    { targetType, targetId },
    { initialNumItems: 10 },
  );
  const addComment = useMutation(api.social.addComment);
  const removeComment = useMutation(api.social.removeComment);
  const showToast = useToast();
  const { t, locale } = useI18n();
  const [confirming, setConfirming] = useState<Id<"comments"> | null>(null);

  async function remove(commentId: Id<"comments">) {
    try {
      await removeComment({ commentId });
      showToast(t("Yorum silindi."), "success");
    } catch (err) {
      showToast(toastErrorMessage(err));
    } finally {
      setConfirming(null);
    }
  }
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (text.trim().length === 0) return;
    setSubmitting(true);
    try {
      await addComment({ targetType, targetId, content: text.trim() });
      setText("");
    } catch (err) {
      showToast(toastErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6">
      <h3 className="font-medium mb-3">{t("Yorumlar")}</h3>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-4">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("Bir şey yaz…")}
          className={`${inputBase} flex-1 text-sm`}
        />
        <button disabled={submitting} className={buttonPrimary}>
          {submitting ? t("Gönderiliyor…") : t("Gönder")}
        </button>
      </form>
      {status === "LoadingFirstPage" ? (
        <Loading />
      ) : results.length === 0 ? (
        <p className="text-sm text-muted">{t("Henüz yorum yok. İlk yorumu sen yaz.")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((comment) => (
            <li key={comment._id} className="group border-b border-border pb-2 text-sm">
              <div className="mb-0.5 flex items-center gap-2 text-xs text-muted">
                <span className="font-medium text-foreground/80">{comment.username ? `@${comment.username}` : t("Silinmiş hesap")}</span>
                <span>{new Date(comment.createdAt).toLocaleDateString(intlLocale(locale), { day: "numeric", month: "short" })}</span>
                {comment.canDelete &&
                  (confirming === comment._id ? (
                    <span className="ml-auto inline-flex items-center gap-2">
                      <span>{t("Yorum silinsin mi?")}</span>
                      <button type="button" onClick={() => void remove(comment._id)} className="font-medium text-red-700 hover:underline dark:text-red-300">
                        {t("Evet, sil")}
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className="hover:text-foreground">
                        {t("Vazgeç")}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(comment._id)}
                      className="ml-auto opacity-0 transition-opacity hover:text-red-700 focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
                    >
                      {t("Sil")}
                    </button>
                  ))}
              </div>
              {comment.content}
            </li>
          ))}
        </ul>
      )}
      {status === "CanLoadMore" && (
        <button onClick={() => loadMore(10)} className={`${buttonLink} mt-2`}>
          {t("Daha fazla yorum")}
        </button>
      )}
    </div>
  );
}

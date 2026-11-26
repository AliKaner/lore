"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { buttonLink, buttonPrimary, inputBase } from "@/lib/ui";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import Loading from "@/components/Loading";
import { useT } from "@/lib/i18n";

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
  const showToast = useToast();
  const t = useT();
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
            <li key={comment._id} className="text-sm border-b border-border pb-2">
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

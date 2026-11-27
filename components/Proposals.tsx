"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { changeCount, diffChapters } from "@/lib/diff";
import { errorText } from "@/components/entity/shared";
import { useToast } from "@/components/Toaster";
import { useI18n } from "@/lib/i18n";

function Diff({ before, after }: { before: string; after: string }) {
  const diff = useMemo(() => diffChapters(before, after), [before, after]);
  return (
    <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-background px-5 py-4 text-[15px] leading-relaxed">
      {diff.map((para, i) => {
        const changed = para.some((p) => p.kind !== "same");
        return (
          <p key={i} className={`mb-3 ${changed ? "" : "text-muted"}`}>
            {para.map((piece, j) =>
              piece.kind === "same" ? (
                <span key={j}>{piece.text}</span>
              ) : piece.kind === "added" ? (
                <ins key={j} className="rounded-[3px] bg-[#dff3e5] text-[#1f5a35] no-underline dark:bg-[#1f3a2a] dark:text-[#a6dfb7]">
                  {piece.text}
                </ins>
              ) : (
                <del key={j} className="rounded-[3px] bg-[#fbe3e6] text-[#8f2d3f] dark:bg-[#40222b] dark:text-[#f0a3b4]">
                  {piece.text}
                </del>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

// Suggested changes to this chapter: who suggested what, the difference
// word by word, and "merge" or "close" for the one who decides.
export default function Proposals({ bookId, chapterId }: { bookId: Id<"books">; chapterId: Id<"chapters"> }) {
  const { t, num } = useI18n();
  const data = useQuery(api.proposals.listForChapter, { chapterId });
  const merge = useMutation(api.proposals.merge);
  const close = useMutation(api.proposals.close);
  const showToast = useToast();
  const [open, setOpen] = useState<Id<"proposals"> | null>(null);
  if (!data || (data.proposals.length === 0 && !data.canPropose)) return null;

  return (
    <section className="mt-10 rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">
          {t("Değişiklik önerileri")}
          {data.proposals.length > 0 && (
            <span className="ml-2 rounded-full bg-caramel-soft px-2 py-0.5 text-xs">{num(data.proposals.length)}</span>
          )}
        </h2>
        {data.canPropose && (
          <Link href={`/book/${bookId}/chapter/${chapterId}/propose`} className="rounded-full border border-border px-3 py-1 text-sm hover:border-accent hover:text-accent">
            {t("Değişiklik öner")}
          </Link>
        )}
      </div>
      {data.proposals.length === 0 ? (
        <p className="mt-1 text-sm text-muted">{t("Bu bölümü düzeltmek ya da geliştirmek istersen kendi halini önerebilirsin; yazarı farkı görüp birleştirir.")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {data.proposals.map((p) => {
            const counts = changeCount(diffChapters(p.baseContent, p.content));
            return (
              <li key={p._id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">@{p.proposerName ?? "—"}</span>
                  <span className="text-xs text-[#2f6b44] dark:text-[#9fd2ad]">+{num(counts.added)}</span>
                  <span className="text-xs text-[#a23a55] dark:text-[#f0a3b4]">−{num(counts.removed)}</span>
                  {p.stale && <span className="rounded-full bg-caramel-soft px-2 text-[11px]">{t("bölüm sonradan değişti")}</span>}
                  <button type="button" onClick={() => setOpen(open === p._id ? null : p._id)} className="ml-auto text-sm text-accent hover:underline">
                    {open === p._id ? t("Gizle") : t("Farkı gör")}
                  </button>
                </div>
                {p.note && <p className="mt-1 text-sm text-foreground/85">“{p.note}”</p>}
                {open === p._id && (
                  <div className="mt-3">
                    <Diff before={p.baseContent} after={p.content} />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.canDecide && (
                        <button
                          type="button"
                          onClick={() => {
                            const message = p.stale
                              ? t("Bölüm bu öneriden sonra değişti; birleştirirsen sonraki değişiklikler yerine bu metin geçer (eski hali sürüm geçmişinde kalır). Devam edilsin mi?")
                              : t("Öneri birleştirilsin mi? Bölümün şimdiki hali sürüm geçmişinde kalır.");
                            if (!window.confirm(message)) return;
                            void merge({ proposalId: p._id }).catch((err) => showToast(errorText(err)));
                          }}
                          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
                        >
                          {t("Birleştir")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void close({ proposalId: p._id }).catch((err) => showToast(errorText(err)))}
                        className="rounded-full border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground"
                      >
                        {p.mine && !data.canDecide ? t("Öneriyi geri çek") : t("Kapat")}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

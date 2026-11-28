"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useI18n } from "@/lib/i18n";
import { timeAgo, useNow } from "@/lib/useNow";

type Draft = FunctionReturnType<typeof api.chapters.myDrafts>[number];

// Publishing a draft, honestly: in a private writing a published chapter is
// still seen by no one, so its owner is offered to open the writing too.
function usePublish(chapterId: Id<"chapters">, bookPrivate: boolean) {
  const publish = useMutation(api.chapters.publishDraft);
  const showToast = useToast();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return {
    busy,
    run: async (openBook: boolean) => {
      setBusy(true);
      try {
        await publish({ chapterId, openBook });
        showToast(
          openBook
            ? t("Yazın herkese açıldı ve bölüm yayınlandı.")
            : bookPrivate
              ? t("Yayınlandı. Yazın gizli olduğu için okurlar yine de göremez.")
              : t("Yayınlandı."),
          "success",
        );
        return true;
      } catch (err) {
        showToast(toastErrorMessage(err));
        return false;
      } finally {
        setBusy(false);
      }
    },
  };
}

// The draft banner's publish button on the reading page: one click in an
// open writing; in a private one, a second step that says what happens.
export function PublishDraftButton({
  chapterId,
  bookPrivate,
  ownsBook,
  className,
}: {
  chapterId: Id<"chapters">;
  bookPrivate: boolean;
  ownsBook: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const { busy, run } = usePublish(chapterId, bookPrivate);
  const [asking, setAsking] = useState(false);
  const style =
    className ?? "rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-contrast hover:bg-accent-hover disabled:opacity-50";

  if (asking) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span>{t("Yazı herkese açılacak.")}</span>
        <button type="button" disabled={busy} onClick={() => void run(true)} className={style}>
          {busy ? t("Yayınlanıyor…") : t("Aç ve yayınla")}
        </button>
        <button type="button" onClick={() => setAsking(false)} className="underline">
          {t("Vazgeç")}
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => (bookPrivate && ownsBook ? setAsking(true) : void run(false))}
      className={style}
    >
      {busy ? t("Yayınlanıyor…") : t("Yayınla")}
    </button>
  );
}

const DotsIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="currentColor">
    <circle cx="4.5" cy="10" r="1.5" />
    <circle cx="10" cy="10" r="1.5" />
    <circle cx="15.5" cy="10" r="1.5" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
    <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
  </svg>
);

type Step = null | "publish" | "delete";

function DraftRow({ draft, now }: { draft: Draft; now: number }) {
  const { t, num, locale } = useI18n();
  const showToast = useToast();
  const remove = useMutation(api.chapters.remove);
  const { busy, run } = usePublish(draft._id, draft.bookPrivate);
  const [menu, setMenu] = useState(false);
  const [step, setStep] = useState<Step>(null);
  const [removing, setRemoving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const editHref = `/book/${draft.bookId}/chapter/${draft._id}/edit`;
  const previewHref = `/book/${draft.bookId}/chapter/${draft._id}`;
  // A private writing's owner publishes by opening it; anyone else can only
  // publish, and is told readers won't see it yet.
  const opens = draft.bookPrivate && draft.ownsBook;

  useEffect(() => {
    if (!menu) return;
    const onDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  async function deleteDraft() {
    setRemoving(true);
    try {
      await remove({ chapterId: draft._id });
      showToast(t("Taslak silindi."), "success");
    } catch (err) {
      showToast(toastErrorMessage(err));
      setRemoving(false);
      setStep(null);
    }
  }

  const item = "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-accent-soft/50";

  return (
    <li className="group relative px-4 py-4 sm:px-5">
      <div className="flex items-start gap-4">
        <Link href={editHref} className="min-w-0 flex-1">
          <p className="truncate font-display text-xl leading-snug group-hover:text-accent">{draft.title || t("Adsız bölüm")}</p>
          {draft.excerpt ? (
            <p className="mt-0.5 line-clamp-1 text-sm italic text-muted">{draft.excerpt}</p>
          ) : (
            <p className="mt-0.5 text-sm italic text-muted/70">{t("Henüz boş")}</p>
          )}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="truncate">{draft.bookTitle}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{t("{n} kelime", { n: num(draft.words) })}</span>
            {now > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{timeAgo(draft.updatedAt, now, locale)}</span>
              </>
            )}
            {draft.bookPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5" title={t("Bu yazı gizli; yayınlansa da okurlar göremez.")}>
                <LockIcon />
                {t("Gizli yazı")}
              </span>
            )}
          </p>
        </Link>

        {step === null && (
          <div ref={box} className="relative flex shrink-0 items-center gap-1.5">
            <Link
              href={editHref}
              className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
            >
              {t("Devam et")}
            </Link>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label={t("Diğer işlemler")}
              onClick={() => setMenu((m) => !m)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft/60 hover:text-foreground"
            >
              <DotsIcon />
            </button>
            {menu && (
              <div role="menu" className="menu-pop absolute right-0 top-11 z-20 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-[0_18px_40px_-20px_rgba(15,25,57,0.55)]">
                <Link role="menuitem" href={previewHref} className={item}>
                  {t("Okur gibi önizle")}
                </Link>
                <button role="menuitem" type="button" className={item} onClick={() => (setMenu(false), setStep("publish"))}>
                  {opens ? t("Yazıyı açıp yayınla…") : t("Yayınla…")}
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  role="menuitem"
                  type="button"
                  disabled={draft.hasContinuations}
                  title={draft.hasContinuations ? t("Bu bölümün devamı var; önce devamındaki bölümleri sil.") : undefined}
                  className={`${item} text-red-700 disabled:opacity-40 dark:text-red-300`}
                  onClick={() => (setMenu(false), setStep("delete"))}
                >
                  {t("Taslağı sil")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {step === "publish" && (
        <div role="alertdialog" className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-accent/40 bg-accent-soft/40 px-4 py-3 text-sm">
          <span className="min-w-[12rem] flex-1">
            {opens
              ? t("“{book}” herkese açılacak ve bu bölüm okurlara görünecek.", { book: draft.bookTitle })
              : draft.bookPrivate
                ? t("Bölüm yayınlanacak ama yazı gizli olduğu için okurlar yine de göremez.")
                : t("Bu bölüm okurlara görünecek.")}
            {draft.words < 50 && <span className="text-muted"> {t("Henüz çok kısa: {n} kelime.", { n: num(draft.words) })}</span>}
          </span>
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={() => void run(opens).then((ok) => ok || setStep(null))}
            className="rounded-full bg-accent px-4 py-1.5 font-medium text-accent-contrast hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? t("Yayınlanıyor…") : opens ? t("Aç ve yayınla") : t("Yayınla")}
          </button>
          <button type="button" onClick={() => setStep(null)} disabled={busy} className="underline">
            {t("Vazgeç")}
          </button>
        </div>
      )}

      {step === "delete" && (
        <div
          role="alertdialog"
          className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          <span className="min-w-[12rem] flex-1">{t("Bu taslak kalıcı olarak silinecek. Geri alınamaz.")}</span>
          <button
            type="button"
            autoFocus
            disabled={removing}
            onClick={() => void deleteDraft()}
            className="rounded-full bg-red-700 px-4 py-1.5 font-medium text-white hover:bg-red-800 disabled:opacity-50"
          >
            {removing ? t("Siliniyor…") : t("Evet, sil")}
          </button>
          <button type="button" onClick={() => setStep(null)} disabled={removing} className="underline">
            {t("Vazgeç")}
          </button>
        </div>
      )}
    </li>
  );
}

// The desk's unpublished chapters: what each one says, where it lives and
// when it was last touched. Carrying on is the first thing; publishing and
// deleting wait behind the menu, each with a step that says what happens.
export default function Drafts({ skip }: { skip?: Id<"chapters"> }) {
  // The one already waiting in "pick up where you left off" is not repeated.
  const drafts = useQuery(api.chapters.myDrafts)?.filter((d) => d._id !== skip);
  const { t, num } = useI18n();
  const now = useNow();
  if (!drafts || drafts.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {t("Taslakların")} <span className="ml-1 tabular-nums text-muted/70">{num(drafts.length)}</span>
      </h2>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {drafts.map((draft) => (
          <DraftRow key={draft._id} draft={draft} now={now} />
        ))}
      </ul>
    </section>
  );
}

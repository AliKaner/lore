"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ChapterEditor } from "@/components/Editor";
import Loading from "@/components/Loading";
import NotFoundState from "@/components/NotFoundState";
import { errorText } from "@/components/entity/shared";
import { useWritingModes } from "@/lib/writingModes";
import { useI18n } from "@/lib/i18n";

// Writing a suggested change: the chapter's text to edit freely, a title
// and a note for its author. Nothing changes until they merge it.
export default function ProposePage({
  params,
}: {
  params: Promise<{ bookId: Id<"books">; chapterId: Id<"chapters"> }>;
}) {
  const { bookId, chapterId } = use(params);
  const { t, locale } = useI18n();
  const router = useRouter();
  const chapter = useQuery(api.chapters.get, { chapterId });
  const book = useQuery(api.books.get, { bookId });
  const access = useQuery(api.proposals.listForChapter, { chapterId });
  const create = useMutation(api.proposals.create);
  const [modes] = useWritingModes();
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (chapter === undefined || book === undefined || access === undefined) return <Loading />;
  if (!chapter || !book || !access?.canPropose) return <NotFoundState title={t("Bu bölüme öneri yapamazsın")} />;

  const back = `/book/${bookId}/chapter/${chapterId}`;
  const changed = (content ?? chapter.content) !== chapter.content || (title ?? chapter.title) !== chapter.title;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href={back} className="text-sm text-muted hover:text-foreground">
        ← {t("Bölüme dön")}
      </Link>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-caramel">{t("Değişiklik önerisi")}</p>
      <p className="mt-1 max-w-xl text-sm text-muted">
        {t("Metni istediğin gibi düzenle. Bölümün yazarı farkı kelime kelime görür; birleştirirse bölüm senin halin olur.")}
      </p>
      <input
        value={title ?? chapter.title}
        onChange={(event) => setTitle(event.target.value)}
        className="mt-6 w-full bg-transparent font-display text-4xl outline-none"
      />
      <div className="mt-6">
        <ChapterEditor
          content={chapter.content}
          onChange={setContent}
          modes={modes}
          lang={book.language ?? locale}
        />
      </div>
      <div className="sticky bottom-0 mt-8 border-t border-border bg-background/90 py-4 backdrop-blur">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("Yazara bir not: neyi neden değiştirdin?")}
          rows={2}
          maxLength={1000}
          className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-[15px] outline-none focus:border-accent"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={!changed || busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await create({ chapterId, title: title ?? chapter.title, content: content ?? chapter.content, note });
                router.push(back);
              } catch (err) {
                setError(t(errorText(err)));
                setBusy(false);
              }
            }}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-hover disabled:opacity-45"
          >
            {busy ? t("Gönderiliyor…") : t("Öneriyi gönder")}
          </button>
          {!changed && <span className="text-sm text-muted">{t("Henüz bir şey değişmedi.")}</span>}
          {error && <span className="text-sm text-red-700 dark:text-red-300">{error}</span>}
        </div>
      </div>
    </main>
  );
}

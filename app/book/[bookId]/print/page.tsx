"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ChapterReader } from "@/components/Editor";
import Loading from "@/components/Loading";
import NotFoundState from "@/components/NotFoundState";
import { chaptersIn } from "@/lib/exportFormats";
import { useWritingKinds } from "@/lib/localized";
import { useT } from "@/lib/i18n";

// A book-like, print-ready page: a title page, then each chapter on its own
// page. The browser's "Save as PDF" turns it into the PDF export.
export default function PrintPage({ params }: { params: Promise<{ bookId: Id<"books"> }> }) {
  const { bookId } = use(params);
  const search = useSearchParams();
  // `kapsam=tum` is the old Turkish link; still honoured.
  const scope = search.get("scope") === "all" || search.get("kapsam") === "tum" ? "all" : "main";
  const data = useQuery(api.exports.bookForExport, { bookId });
  const t = useT();
  const kinds = useWritingKinds();

  if (data === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Loading />
      </main>
    );
  }
  if (data === null) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <NotFoundState />
      </main>
    );
  }

  const chapters = chaptersIn(data, scope);
  const kind = kinds[data.book.kind]?.label;

  return (
    <div className="print-book bg-background print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur print:hidden sm:px-6">
        <Link href={`/book/${bookId}`} className="text-sm text-muted hover:text-foreground">
          ← {t("Yazıya dön")}
        </Link>
        <p className="hidden text-sm text-muted sm:block">
          {t("Yazdır penceresinde hedef olarak “PDF olarak kaydet”i seç.")}
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
        >
          {t("PDF olarak kaydet")}
        </button>
      </div>

      <div className="mx-auto my-10 max-w-[44rem] bg-surface px-10 py-16 shadow-[0_30px_80px_-50px_rgba(15,25,57,0.5)] print:m-0 print:max-w-none print:bg-white print:p-0 print:shadow-none sm:px-16">
        <section className="print-title-page flex min-h-[60vh] flex-col items-center justify-center text-center print:min-h-[85vh]">
          {kind && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sapphire">{kind}</p>}
          <h1 className="mt-4 font-display text-5xl leading-tight">{data.book.title}</h1>
          <span aria-hidden="true" className="mt-6 h-2 w-2 rotate-45 bg-caramel" />
          {data.book.description && (
            <p className="mt-6 max-w-md font-display text-lg italic text-muted">{data.book.description}</p>
          )}
        </section>

        {chapters.map((chapter) => (
          <section key={chapter._id} className="print-chapter mt-24 print:mt-0">
            <h2 className="mb-10 text-center font-display text-3xl">
              {!chapter.onMainLine && <span className="block text-xs uppercase tracking-[0.18em] text-muted">{t("Dal")}</span>}
              {chapter.title}
            </h2>
            <div className="text-[1.05rem] leading-[1.85] [text-align:justify] [hyphens:auto]" lang="tr">
              <ChapterReader content={chapter.content} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

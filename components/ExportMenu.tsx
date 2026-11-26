"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { download, slugify, toDocx, toMarkdown, type Scope } from "@/lib/exportFormats";
import { useT } from "@/lib/i18n";

function Row({
  title,
  detail,
  badge,
  onClick,
  href,
  busy,
}: {
  title: string;
  detail: string;
  badge: string;
  onClick?: () => void;
  href?: string;
  busy?: boolean;
}) {
  const t = useT();
  const inner = (
    <>
      <span className="inline-flex h-9 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-[10px] font-semibold uppercase tracking-wider text-sapphire">
        {badge}
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-sm font-medium text-foreground">{busy ? t("Hazırlanıyor…") : title}</span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
    </>
  );
  const cls =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-caramel-soft/60 disabled:opacity-50";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} disabled={busy} className={cls}>
      {inner}
    </button>
  );
}

// "Take it with you": the writing as Word, Markdown or a print-ready PDF.
export default function ExportMenu({ bookId }: { bookId: Id<"books"> }) {
  const convex = useConvex();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("main");
  const [busy, setBusy] = useState<"docx" | "md" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function run(format: "docx" | "md") {
    setBusy(format);
    setError(null);
    try {
      const data = await convex.query(api.exports.bookForExport, { bookId });
      if (!data) throw new Error("not owner");
      const name = slugify(data.book.title);
      if (format === "md") {
        const text = toMarkdown(data, { scope, includeNotes: false });
        download(new Blob([text], { type: "text/markdown;charset=utf-8" }), `${name}.md`);
      } else {
        download(await toDocx(data, scope), `${name}.docx`);
      }
      setOpen(false);
    } catch {
      setError(t("Dosya hazırlanamadı. Tekrar dene."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
          open ? "border-accent text-accent" : "border-border text-foreground hover:border-border-hover"
        }`}
      >
        <span aria-hidden="true">↓</span> {t("Dışa aktar")}
      </button>
      {open && (
        <>
          <button type="button" aria-label="Kapat" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="menu-pop absolute left-0 top-10 z-50 w-[min(20rem,calc(100vw-2rem))] origin-top-left rounded-xl border border-border bg-surface p-2 shadow-[0_24px_60px_-28px_rgba(15,25,57,0.45)]">
            <Row badge="docx" title={t("Word belgesi")} detail={t("Editöre, yayınevine göndermek için")} busy={busy === "docx"} onClick={() => void run("docx")} />
            <Row
              badge="pdf"
              title="PDF"
              detail={t("Baskıya hazır sayfa; “PDF olarak kaydet”")}
              href={`/book/${bookId}/print${scope === "all" ? "?scope=all" : ""}`}
            />
            <Row badge="md" title="Markdown" detail={t("Düz metin; her yerde açılır")} busy={busy === "md"} onClick={() => void run("md")} />
            <label className="mt-1 flex cursor-pointer items-center gap-2 border-t border-border px-3 pb-1 pt-3 text-xs text-muted">
              <input
                type="checkbox"
                checked={scope === "all"}
                onChange={(event) => setScope(event.target.checked ? "all" : "main")}
                className="accent-[var(--caramel)]"
              />
              {t("Ana hattın dışındaki dalları da ekle")}
            </label>
            {error && <p className="px-3 pb-2 pt-1 text-xs text-red-700">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}

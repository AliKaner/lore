"use client";

import { useState } from "react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { download, slugify, toMarkdown } from "@/lib/exportFormats";
import { useT } from "@/lib/i18n";

// Downloads every writing as Markdown (all branches, drafts and notes as
// footnotes) in one ZIP.
export default function BackupButton() {
  const convex = useConvex();
  const t = useT();
  const [state, setState] = useState<{ kind: "idle" } | { kind: "busy"; done: number; total: number } | { kind: "error" }>({
    kind: "idle",
  });

  async function run() {
    try {
      const books = await convex.query(api.books.listMine, {});
      setState({ kind: "busy", done: 0, total: books.length });
      const { zipSync, strToU8 } = await import("fflate");
      const files: Record<string, Uint8Array> = {};
      const used = new Set<string>();
      for (const [i, book] of books.entries()) {
        const data = await convex.query(api.exports.bookForExport, { bookId: book._id });
        if (data) {
          let name = slugify(data.book.title);
          while (used.has(name)) name += "-2";
          used.add(name);
          files[`booktion-yedek/${name}.md`] = strToU8(toMarkdown(data, { scope: "all", includeNotes: true }));
        }
        setState({ kind: "busy", done: i + 1, total: books.length });
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const zipped = zipSync(files, { level: 6 });
      download(new Blob([zipped as BlobPart], { type: "application/zip" }), `booktion-yedek-${stamp}.zip`);
      setState({ kind: "idle" });
    } catch {
      setState({ kind: "error" });
    }
  }

  const busy = state.kind === "busy";
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-medium text-foreground transition-colors hover:border-border-hover disabled:cursor-wait disabled:opacity-60"
      >
        <span aria-hidden="true">↓</span>
        {busy ? `${t("Hazırlanıyor…")} ${state.done}/${state.total}` : t("Tüm yazılarımı indir (.zip)")}
      </button>
      {state.kind === "error" && (
        <span role="alert" className="text-sm text-red-700">
          {t("Yedek hazırlanamadı. Bağlantını kontrol edip tekrar dene.")}
        </span>
      )}
    </div>
  );
}

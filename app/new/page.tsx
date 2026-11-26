"use client";

import NewBookButton from "@/components/NewBookButton";
import { KIND_ORDER } from "@/lib/writingKinds";
import { useWritingKinds } from "@/lib/localized";
import { useT } from "@/lib/i18n";

export default function ChooseKindPage() {
  const t = useT();
  const kinds = useWritingKinds();
  return (
    <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">
        {t("Yeni yazı")}
      </p>
      <h1 className="mt-3 font-display text-5xl font-normal leading-tight">
        {t("Bugün ne yazmak istiyorsun?")}
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        {t("Her tür kendi masasıyla gelir: şablonu, başlığı, kimin görebileceği ve okurların neler yapabileceği ona göre ayarlanır.")}
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KIND_ORDER.map((kind) => {
          const cfg = kinds[kind];
          return (
            <li key={kind}>
              <NewBookButton
                kind={kind}
                className="flex h-full w-full flex-col gap-3 rounded-lg border border-border bg-surface p-6 text-left transition-colors hover:border-accent disabled:opacity-60"
              >
                <span className="font-display text-2xl">{cfg.label}</span>
                <span className="text-sm leading-relaxed text-muted">{cfg.pitch}</span>
                <span className="mt-auto pt-2 text-sm font-medium text-accent">
                  {cfg.firstUnitCta} →
                </span>
              </NewBookButton>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

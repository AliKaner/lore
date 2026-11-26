"use client";

import NotFoundState from "@/components/NotFoundState";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <NotFoundState title={t("Bu sayfa bulunamadı")} />
    </main>
  );
}

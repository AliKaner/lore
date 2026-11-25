"use client";

import { useEffect } from "react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import NotFoundState from "@/components/NotFoundState";
import { buttonPrimary } from "@/lib/ui";

// A mistyped or truncated link reaches Convex as an id that fails validation;
// that is a missing page, not a crash.
function isBadLink(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /ArgumentValidationError|does not match validator|Invalid argument/i.test(message);
}

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {isBadLink(error) ? (
        <NotFoundState title="Bu bağlantı bir yere çıkmıyor" />
      ) : (
        <EmptyState
          art="lost"
          eyebrow="Beklenmedik bir durum"
          title="Bir şeyler ters gitti"
          actions={
            <>
              <button onClick={() => retry()} className={`${buttonPrimary} px-6`}>
                Tekrar dene
              </button>
              <Link
                href="/yazilarim"
                className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
              >
                Yazılarıma dön
              </Link>
            </>
          }
        >
          <p>
            Sayfa yüklenirken bir sorun çıktı. Taslakların hem sunucuya hem bu
            cihaza kaydedilir; tekrar denemek çoğu zaman yeter.
          </p>
        </EmptyState>
      )}
    </main>
  );
}

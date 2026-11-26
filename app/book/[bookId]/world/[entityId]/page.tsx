"use client";

import { use } from "react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import EntityView from "@/components/entity/EntityView";
import { useT } from "@/lib/i18n";

export default function BookEntityPage({
  params,
}: {
  params: Promise<{ bookId: Id<"books">; entityId: Id<"entities"> }>;
}) {
  const { bookId, entityId } = use(params);
  const t = useT();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href={`/book/${bookId}`} className="text-sm text-muted hover:text-foreground">
        ← {t("Yazıya dön")}
      </Link>
      <div className="mt-8">
        <EntityView entityId={entityId} bookId={bookId} />
      </div>
    </main>
  );
}

"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import EntityEditor from "@/components/entity/EntityEditor";
import { useT } from "@/lib/i18n";

export default function EntityPage({ params }: { params: Promise<{ entityId: Id<"entities"> }> }) {
  const { entityId } = use(params);
  const router = useRouter();
  const t = useT();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/world" className="text-sm text-muted hover:text-foreground">
        ← {t("Evrenin")}
      </Link>
      <div className="mt-8">
        <EntityEditor
          entityId={entityId}
          onOpenEntity={(id) => router.push(`/world/${id}`)}
          afterDelete={() => "/world"}
        />
      </div>
    </main>
  );
}

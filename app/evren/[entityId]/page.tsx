"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import EntityEditor from "@/components/entity/EntityEditor";

export default function EntityPage({ params }: { params: Promise<{ entityId: Id<"entities"> }> }) {
  const { entityId } = use(params);
  const router = useRouter();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/evren" className="text-sm text-muted hover:text-foreground">
        ← Evrenin
      </Link>
      <div className="mt-8">
        <EntityEditor
          entityId={entityId}
          onOpenEntity={(id) => router.push(`/evren/${id}`)}
          afterDelete={() => "/evren"}
        />
      </div>
    </main>
  );
}

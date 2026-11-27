"use client";

import Link from "next/link";
import RelationsGraph from "@/components/entity/RelationsGraph";
import { eyebrow } from "@/components/entity/shared";
import { useT } from "@/lib/i18n";

// The whole cast and how they relate: family, love, friendship, enmity.
export default function RelationsPage() {
  const t = useT();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/world" className="text-sm text-muted hover:text-foreground">
        ← {t("Evren")}
      </Link>
      <p className={`${eyebrow} mt-3 text-caramel`}>{t("Evrenin")}</p>
      <h1 className="mt-1 font-display text-5xl leading-tight">{t("İlişki ağı")}</h1>
      <p className="mt-2 max-w-xl text-muted">
        {t("Kim kimin annesi, kim kime aşık, kim kimin düşmanı. Bir karakterin sayfasında “İlişkileri” bölümünü doldurdukça ağ kendiliğinden büyür. Bir isme gelince bağları öne çıkar.")}
      </p>
      <div className="mt-8">
        <RelationsGraph
          height={620}
          empty={
            <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-muted">
              {t("Henüz bağ yok. Bir karakter aç, “Ailesi” ya da “İlişkileri” bölümünden başka karakterlere bağla.")}
              <div className="mt-4">
                <Link href="/world?kind=character" className="text-accent hover:underline">
                  {t("Karakterlere git")}
                </Link>
              </div>
            </div>
          }
        />
      </div>
    </main>
  );
}

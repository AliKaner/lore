"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { levelInfo } from "@/lib/levels";
import { card, cardList } from "@/lib/ui";
import SignInPrompt from "@/components/SignInPrompt";
import Loading from "@/components/Loading";
import { useT } from "@/lib/i18n";

export default function LibraryPage() {
  const me = useQuery(api.users.me);
  const library = useQuery(api.reading.myLibrary, me ? {} : "skip");
  const t = useT();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-1">{t("Kütüphanem")}</h1>

      {me === undefined ? (
        <Loading />
      ) : me === null ? (
        <SignInPrompt title={t("Kütüphaneni görmek için giriş yap")} />
      ) : (
        <>
          <div className="mb-6 mt-1">
            {(() => {
              const { badge, title, progressPercent } = levelInfo(me.level, me.xp);
              return (
                <>
                  <p className="text-muted text-sm">
                    {badge} {t(title)} · {t("Seviye {n}", { n: me.level })} · {me.xp} XP
                  </p>
                  <div className="w-48 h-1.5 bg-border rounded-full mt-1">
                    <div
                      className="h-1.5 bg-foreground rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </div>

          {library === undefined ? (
            <Loading />
          ) : library.length === 0 ? (
            <p className="text-muted text-sm">
              {t("Henüz bir bölüm okumadın. Sana paylaşılan bir bağlantıdan okumaya başla.")}
            </p>
          ) : (
            <ul className={cardList}>
              {library.map((entry) => (
                <li key={entry!.book._id} className={card}>
                  <Link href={`/book/${entry!.book._id}`} className="font-medium">
                    {entry!.book.title}
                  </Link>
                  <p className="text-muted text-sm mt-1">
                    {t("{n} bölüm okundu", { n: entry!.chaptersRead })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

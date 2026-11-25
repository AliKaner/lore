"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { buttonLink, buttonSecondary, card, cardList } from "@/lib/ui";
import SignInPrompt from "@/components/SignInPrompt";
import Loading from "@/components/Loading";
import { toastErrorMessage, useToast } from "@/components/Toaster";

export default function ModerationPage() {
  const me = useQuery(api.users.me);
  const reports = useQuery(api.reports.listForMyBooks, me ? {} : "skip");
  const resolve = useMutation(api.reports.resolve);
  const hideBranch = useMutation(api.chapters.hideBranch);
  const showToast = useToast();

  async function handleResolve(reportId: Id<"reports">) {
    try {
      await resolve({ reportId });
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  async function handleHideBranch(chapterId: Id<"chapters">) {
    try {
      await hideBranch({ chapterId });
      showToast("Dal gizlendi.", "success");
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Moderasyon</h1>
      <p className="text-muted text-sm mb-6">
        Kitaplarındaki bölümler veya kitapların hakkında yapılan bildirimler.
      </p>

      {me === undefined ? (
        <Loading />
      ) : me === null ? (
        <SignInPrompt title="Bildirimlerini görmek için giriş yap" />
      ) : reports === undefined ? (
        <Loading />
      ) : reports.length === 0 ? (
        <p className="text-muted text-sm">Açık bildirim yok.</p>
      ) : (
        <ul className={cardList}>
          {reports.map((report) => (
            <li key={report._id} className={card}>
              <p className="text-sm text-muted mb-1">
                {report.targetType === "book" ? "Kitap" : "Bölüm"} bildirimi
              </p>
              <p className="text-sm mb-3">{report.reason}</p>
              <div className="flex flex-wrap gap-2">
                {report.targetType === "chapter" && (
                  <button
                    onClick={() =>
                      void handleHideBranch(report.targetId as Id<"chapters">)
                    }
                    className={buttonSecondary}
                  >
                    Dalı gizle
                  </button>
                )}
                <button
                  onClick={() => void handleResolve(report._id)}
                  className={buttonLink}
                >
                  Çözüldü işaretle
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

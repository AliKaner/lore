"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { pillInactive } from "@/lib/ui";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useT } from "@/lib/i18n";

export default function ShareButton({
  targetType,
  targetId,
  shareCount,
}: {
  targetType: "book" | "chapter";
  targetId: string;
  shareCount: number;
}) {
  const recordShare = useMutation(api.social.recordShare);
  const showToast = useToast();
  const t = useT();

  async function handleShare() {
    try {
      await recordShare({ targetType, targetId });
    } catch (err) {
      showToast(toastErrorMessage(err));
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(t("Bağlantı kopyalandı."), "success");
    } catch {
      // panoya kopyalama desteklenmiyorsa sessizce geç
    }
  }

  return (
    <button onClick={() => void handleShare()} className={pillInactive}>
      ↗ {t("Paylaş")} ({shareCount})
    </button>
  );
}

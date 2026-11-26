"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import { buttonPrimary } from "@/lib/ui";
import { useT } from "@/lib/i18n";

// Shown in place of a page that needs an account. After signing in the
// writer comes straight back here.
export default function SignInPrompt({
  title,
}: {
  title?: string;
}) {
  const pathname = usePathname();
  const t = useT();
  const next = pathname && pathname !== "/sign-in" ? `?next=${encodeURIComponent(pathname)}` : "";
  return (
    <EmptyState
      art="locked"
      eyebrow={t("Hesabınla devam et")}
      title={title ?? t("Devam etmek için giriş yap")}
      actions={
        <>
          <Link href={`/sign-in${next}`} className={`${buttonPrimary} px-6`}>
            {t("Giriş yap")}
          </Link>
          <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
            {t("Booktion'u tanı")}
          </Link>
        </>
      }
    >
      <p>
        {t("Yazıların, taslakların ve notların hesabına bağlı. Kullanıcı adın ve şifrenle gir; hesabın yoksa bir dakikada açılır.")}
      </p>
    </EmptyState>
  );
}

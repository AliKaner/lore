"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import EmptyState from "@/components/EmptyState";
import { buttonPrimary } from "@/lib/ui";

// Shown in place of a page that needs an account. After signing in the
// writer comes straight back here.
export default function SignInPrompt({
  title = "Devam etmek için giriş yap",
}: {
  title?: string;
}) {
  const pathname = usePathname();
  const next = pathname && pathname !== "/giris" ? `?next=${encodeURIComponent(pathname)}` : "";
  return (
    <EmptyState
      art="locked"
      eyebrow="Hesabınla devam et"
      title={title}
      actions={
        <>
          <Link href={`/giris${next}`} className={`${buttonPrimary} px-6`}>
            Giriş yap
          </Link>
          <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
            Booktion&apos;u tanı
          </Link>
        </>
      }
    >
      <p>
        Yazıların, taslakların ve notların hesabına bağlı. Şifre yok:
        kullanıcı adını yaz, cihazının parmak izi, yüz tanıma ya da ekran
        kilidiyle gir. Hesabın yoksa aynı adımda açılır.
      </p>
    </EmptyState>
  );
}

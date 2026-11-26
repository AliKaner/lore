import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { buttonPrimary } from "@/lib/ui";
import { useT } from "@/lib/i18n";

// For a writing, chapter or profile that can't be shown. We don't say which
// of the reasons it is: a private writing must look exactly like a missing
// one.
export default function NotFoundState({
  title,
  backHref = "/my-writing",
  backLabel,
}: {
  title?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const t = useT();
  return (
    <EmptyState
      art="lost"
      eyebrow={t("Bu dal bir yere varmıyor")}
      title={title ?? t("Bu yazı bulunamadı")}
      actions={
        <>
          <Link href={backHref} className={`${buttonPrimary} px-6`}>
            {backLabel ?? t("Yazılarıma dön")}
          </Link>
          <Link href="/new" className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
            {t("Yeni bir yazı başlat")}
          </Link>
        </>
      }
    >
      <p>
        {t("Silinmiş, yazarı tarafından gizlenmiş ya da bağlantı eksik kopyalanmış olabilir. Bağlantıyı sana gönderen kişiden yeniden isteyebilirsin.")}
      </p>
    </EmptyState>
  );
}

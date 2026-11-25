import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { buttonPrimary } from "@/lib/ui";

// For a writing, chapter or profile that can't be shown. We don't say which
// of the reasons it is: a private writing must look exactly like a missing
// one.
export default function NotFoundState({
  title = "Bu yazı bulunamadı",
  backHref = "/yazilarim",
  backLabel = "Yazılarıma dön",
}: {
  title?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <EmptyState
      art="lost"
      eyebrow="Bu dal bir yere varmıyor"
      title={title}
      actions={
        <>
          <Link href={backHref} className={`${buttonPrimary} px-6`}>
            {backLabel}
          </Link>
          <Link href="/yaz" className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
            Yeni bir yazı başlat
          </Link>
        </>
      }
    >
      <p>
        Silinmiş, yazarı tarafından gizlenmiş ya da bağlantı eksik kopyalanmış
        olabilir. Bağlantıyı sana gönderen kişiden yeniden isteyebilirsin.
      </p>
    </EmptyState>
  );
}

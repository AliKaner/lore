import Link from "next/link";
import { buttonPrimary } from "@/lib/ui";

export default function SignInPrompt({
  message = "Bunu yapabilmek için giriş yapman gerekiyor.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted text-sm">{message}</p>
      <Link href="/giris" className={buttonPrimary}>
        Giriş yap
      </Link>
    </div>
  );
}

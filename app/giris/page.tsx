"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignInWithUsernamePasskey } from "@convex-dev/auth/methods/username-passkey/react";
import { api } from "@/convex/_generated/api";
import EmptyState from "@/components/EmptyState";
import { safeNext } from "@/lib/safeNext";
import { buttonPrimary, inputBase } from "@/lib/ui";

export default function SignInPage() {
  const { signIn, pending } = useSignInWithUsernamePasskey(api.auth);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const result = await signIn({ username });
    if (result.status !== "complete") {
      setError(
        typeof result.userError?.error === "string"
          ? result.userError.error
          : "Giriş başarısız oldu.",
      );
      return;
    }
    router.push(safeNext(searchParams.get("next")));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <EmptyState
        art="locked"
        eyebrow="Giriş ya da kayıt"
        title="Masana hoş geldin"
        actions={
          <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3 text-left">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Kullanıcı adı
            </label>
            <input
              id="username"
              autoFocus
              autoComplete="username webauthn"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="ör. selinaras"
              className={`${inputBase} bg-surface`}
            />
            <button
              disabled={pending || username.trim().length === 0}
              className={`${buttonPrimary} py-2.5`}
            >
              {pending ? "Cihazın onayı bekleniyor…" : "Devam et"}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="mt-1 text-center text-xs text-muted">
              Hesabın yoksa bu adımda açılır. Şifre yok; parmak izi, yüz tanıma
              ya da ekran kilidiyle girersin.
            </p>
          </form>
        }
      >
        <p>Kullanıcı adını yaz, cihazın seni tanısın.</p>
      </EmptyState>
    </main>
  );
}

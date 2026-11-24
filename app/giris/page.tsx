"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignInWithUsernamePasskey } from "@convex-dev/auth/methods/username-passkey/react";
import { api } from "@/convex/_generated/api";
import { buttonPrimary, inputBase } from "@/lib/ui";

export default function SignInPage() {
  const { signIn, pending } = useSignInWithUsernamePasskey(api.auth);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
    router.push("/kesfet");
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Giriş yap</h1>
      <p className="text-muted mb-6 text-sm">
        Bir kullanıcı adı yaz. Hesabın yoksa otomatik açılır; cihazının
        parmak izi / yüz tanıma / kilidiyle giriş yaparsın, şifre yok.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          autoComplete="username webauthn"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="kullanıcı adı"
          className={inputBase}
        />
        <button
          disabled={pending || username.trim().length === 0}
          className={buttonPrimary}
        >
          Devam et
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </main>
  );
}

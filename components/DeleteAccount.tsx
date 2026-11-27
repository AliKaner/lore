"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useT } from "@/lib/i18n";

const input =
  "mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3.5 text-[15px] outline-none transition-colors hover:border-border-hover focus:border-red-600";

// Deleting the account: closed until asked for, then the username and the
// password typed again. It says plainly what goes and what stays.
export default function DeleteAccount({ username }: { username: string }) {
  const remove = useMutation(api.users.deleteAccount);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const showToast = useToast();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const matches = typed.trim().replace(/^@/, "").toLocaleLowerCase("tr-TR") === username.toLocaleLowerCase("tr-TR");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!matches || !password) return;
    setBusy(true);
    try {
      const { error } = await remove({ username: typed, password });
      if (error) {
        showToast(t(error));
        setBusy(false);
        return;
      }
      await signOut().catch(() => undefined);
      showToast(t("Hesabın silindi."), "success");
      router.replace("/");
    } catch (err) {
      showToast(toastErrorMessage(err));
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full border border-red-300 px-4 py-2 text-sm text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        {t("Hesabımı sil")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-red-300 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/30">
      <ul className="list-disc space-y-1 pl-5 text-sm text-red-900 dark:text-red-200">
        <li>{t("Bütün yazıların, bölümlerin ve taslakların silinir; onlara yazılan devamlar da.")}</li>
        <li>{t("Evrenin (karakterler, yerler, zaman çizelgesi), panoların, yorumların ve beğenilerin silinir.")}</li>
        <li>{t("Başkasının yazısına eklediğin bir bölümün devamı yazıldıysa o bölüm adsız olarak kalır.")}</li>
        <li>{t("Kullanıcı adın serbest kalır. Bu işlem geri alınamaz; önce yedeğini indirmek isteyebilirsin.")}</li>
      </ul>
      <label className="mt-5 block text-sm">
        {t("Onaylamak için kullanıcı adını yaz: {name}", { name: `@${username}` })}
        <input autoFocus value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" spellCheck={false} className={input} />
      </label>
      <label className="mt-3 block text-sm">
        {t("Şifren")}
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className={input} />
      </label>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!matches || !password || busy}
          className="rounded-full bg-red-700 px-5 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-45"
        >
          {busy ? t("Siliniyor…") : t("Hesabımı kalıcı olarak sil")}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-sm underline">
          {t("Vazgeç")}
        </button>
      </div>
    </form>
  );
}

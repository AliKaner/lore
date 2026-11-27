"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loading from "@/components/Loading";
import BackupButton from "@/components/BackupButton";
import DeleteAccount from "@/components/DeleteAccount";
import { ThemeGrid } from "@/components/ThemePicker";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { authErrorMessage } from "@/lib/authErrors";
import { useT } from "@/lib/i18n";

const input =
  "mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3.5 text-[15px] outline-none transition-colors hover:border-border-hover focus:border-accent";

function ChangePassword() {
  const changePassword = useMutation(api.auth.changePassword);
  const showToast = useToast();
  const t = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!current || !next) {
      setError(t("İki şifreyi de yaz."));
      return;
    }
    setBusy(true);
    try {
      const result = await changePassword({
        currentPassword: current,
        newPassword: next,
        signOutOtherSessions: signOutOthers,
      });
      if (result.success) {
        setCurrent("");
        setNext("");
        showToast(t("Şifren değişti."), "success");
      } else {
        const [message, vars] = authErrorMessage(result.userError);
        setError(
          result.userError.error === "INVALID_CREDENTIALS" ? t("Şu anki şifren yanlış.") : t(message, vars),
        );
      }
    } catch (err) {
      showToast(toastErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-5 rounded-xl border border-border bg-surface px-5 py-5">
      {/* Lets password managers attach the new password to the account. */}
      <label className="block text-sm font-medium text-foreground">
        {t("Şu anki şifren")}
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          className={input}
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-foreground">
        {t("Yeni şifre")}
        <input
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          aria-describedby="new-password-hint"
          className={input}
        />
      </label>
      <p id="new-password-hint" className="mt-1.5 text-xs text-muted">
        {t("En az 10 karakter. Başka bir yerde kullanmadığın bir şifre seç.")}
      </p>
      <label className="mt-4 flex items-center gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          checked={signOutOthers}
          onChange={(event) => setSignOutOthers(event.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        {t("Diğer cihazlardaki oturumları kapat")}
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="mt-5 inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast shadow-[0_10px_24px_-14px_rgba(38,66,139,0.9)] hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? t("Değiştiriliyor…") : t("Şifreyi değiştir")}
      </button>
    </form>
  );
}

export default function AccountPage() {
  const me = useQuery(api.users.me);
  const t = useT();

  if (me === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Loading />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">{t("Hesap")}</p>
      <h1 className="mt-2 font-display text-4xl leading-tight">{t("Hesap ve güvenlik")}</h1>
      {me?.username && (
        <p className="mt-2 text-muted">
          {t("Kullanıcı adın:")} <span className="font-medium text-foreground">@{me.username}</span>
        </p>
      )}

      {/* Colour theme */}
      <section className="mt-10">
        <h2 className="font-display text-2xl">{t("Renk teması")}</h2>
        <p className="mt-1 mb-4 text-sm text-muted">{t("Bütün sayfalarda ve yazma ekranında geçerli; hesabınla her cihaza gelir.")}</p>
        <ThemeGrid />
      </section>

      {/* Password */}
      <section className="mt-12">
        <h2 className="font-display text-2xl">{t("Şifre")}</h2>
        <p className="mt-1 text-sm text-muted">{t("Şifreni değiştirmek için önce şu ankini yaz.")}</p>
        <ChangePassword />
      </section>

      {/* Backup */}
      <section className="mt-12">
        <h2 className="font-display text-2xl">{t("Yazılarının yedeği")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {t("Bütün yazılarını, her biri ayrı bir Markdown dosyası olarak tek bir ZIP içinde indir. Notların ve taslakların da dahil; ne olursa olsun metnin sende kalır.")}
        </p>
        <div className="mt-4">
          <BackupButton />
        </div>
      </section>

      {/* Leaving */}
      {me?.username && (
        <section className="mt-12 border-t border-border pt-10">
          <h2 className="font-display text-2xl">{t("Hesabı sil")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {t("Hesabın ve yazdığın her şey kalıcı olarak silinir.")}
          </p>
          <DeleteAccount username={me.username} />
        </section>
      )}
    </main>
  );
}

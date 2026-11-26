"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useSignInWithUsernamePassword,
  useSignUpWithUsernamePassword,
} from "@convex-dev/auth/methods/username-password/react";
import { api } from "@/convex/_generated/api";
import BranchField from "@/components/BranchField";
import Wordmark from "@/components/Wordmark";
import { safeNext } from "@/lib/safeNext";
import { useT } from "@/lib/i18n";
import { authErrorMessage } from "@/lib/authErrors";

const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

const branchMask: CSSProperties = {
  maskImage: "linear-gradient(to top, black 0%, black 35%, transparent 80%)",
  WebkitMaskImage: "linear-gradient(to top, black 0%, black 35%, transparent 80%)",
};

// A page of the real editor, with the things that make it Booktion: names
// the writer has cast, a private note, autosave and the word count.
function EditorPreview() {
  const t = useT();
  return (
    <div
      role="img"
      aria-label={t("Booktion editörü: karakter ve mekan adları vurgulu, bir yazar notu açık")}
      className="anim-settle relative w-full max-w-[30rem] rounded-xl border border-border bg-surface shadow-[0_30px_80px_-40px_rgba(15,25,57,0.45)]"
      style={delay(0.15)}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-3 truncate text-xs text-muted">
          <span className="font-semibold uppercase tracking-[0.12em] text-sapphire">{t("Roman")}</span>
          {" · "}{t("Kuzey Limanı")} · {t("3. bölüm")}
        </span>
      </div>
      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5 text-xs text-muted">
        <span className="rounded-sm px-1.5 py-0.5 font-bold text-foreground">{t("K")}</span>
        <span className="rounded-sm px-1.5 py-0.5 italic text-foreground">{t("İ")}</span>
        <span className="rounded-sm px-1.5 py-0.5 font-display text-foreground">{t("Başlık")}</span>
        <span className="mx-1 h-4 w-px bg-border" />
        <span className="inline-flex items-center gap-1 rounded-sm bg-accent-soft px-1.5 py-0.5 text-accent">
          <span className="inline-block h-2 w-2 rounded-[2px] bg-caramel/70" /> {t("Not")}
        </span>
        <span className="px-1.5 py-0.5">+ {t("Karakter")}</span>
      </div>
      <div className="relative px-6 pb-5 pt-5">
        <h3 className="font-display text-2xl text-foreground">{t("Sis")}</h3>
        <p className="mt-3 text-[15px] leading-7 text-foreground">
          {t("Sabah sisi")} <span className="name-mark name-place">{t("Kuzey Limanı")}</span>
          {t(" üzerine çöktüğünde")} <span className="name-mark name-character">Selin</span>{" "}
          {t("iskelenin ucunda bekliyordu.")}{" "}
          <span className="author-note">{t("Babasının teknesi üç gündür dönmemişti")}</span>{" "}
          {t("ve kimse ona doğrudan bir şey söylemiyordu.")}
        </p>
        <p className="mt-3 text-[15px] leading-7 text-foreground">
          <span className="name-mark name-character">Selin Aras</span>
          {t(", haritalarını katlayıp çantasına koydu")}
          <span className="anim-blink ml-px inline-block h-[1.1em] w-px translate-y-[3px] bg-foreground" />
        </p>

        <div
          className="anim-pop absolute -right-6 -top-14 w-52 rounded-lg border border-caramel/60 bg-caramel-soft px-3 py-2.5 text-left shadow-[0_16px_40px_-24px_rgba(15,25,57,0.5)] sm:-right-10"
          style={delay(1.1)}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t("Notun · yalnızca sen")}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-foreground">
            {t("Tekne batmadı. 7. bölümde ortaya çıkacak.")}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4f9d69]" /> {t("Taslak kaydedildi")} · 14:32
        </span>
        <span className="tabular-nums">{t("1.284 kelime")}</span>
      </div>
    </div>
  );
}

function SpeedPreview() {
  const t = useT();
  return (
    <div
      aria-hidden="true"
      className="anim-pop absolute -bottom-24 -left-8 hidden w-48 rounded-lg border border-border bg-surface px-4 py-3 shadow-[0_16px_40px_-24px_rgba(15,25,57,0.5)] xl:block"
      style={delay(1.4)}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{t("Akış ile oku")}</p>
      <p className="mt-1.5 grid grid-cols-[1fr_auto_1fr] font-display text-2xl leading-none">
        <span className="text-right">li</span>
        <span className="text-caramel">m</span>
        <span>anı</span>
      </p>
      <p className="mt-1.5 text-center text-[11px] tabular-nums text-muted">{t("{n} kelime/dk", { n: 320 })}</p>
    </div>
  );
}

const promises = [
  "Kullanıcı adın ve şifrenle her cihazdan girersin",
  "Yazdıkça taslağın kendiliğinden kaydedilir",
  "Notların ve gizli yazıların yalnızca sana görünür",
];

type Mode = "signIn" | "signUp";

const field =
  "mt-2 flex h-12 items-center rounded-md border bg-surface transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)]";

export default function SignInPage() {
  const { signIn, pending: signingIn } = useSignInWithUsernamePassword(api.auth);
  const { signUp, pending: signingUp } = useSignUpWithUsernamePassword(api.auth);
  const pending = signingIn || signingUp;
  const [mode, setMode] = useState<Mode>("signIn");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const t = useT();
  const signingUpNow = mode === "signUp";

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const name = username.trim();
    if (name.length === 0) {
      setError(t("Önce bir kullanıcı adı yaz."));
      usernameRef.current?.focus();
      return;
    }
    if (password.length === 0) {
      setError(t("Şifreni yaz."));
      passwordRef.current?.focus();
      return;
    }
    const credentials = { username: name, password };
    const result = signingUpNow ? await signUp(credentials) : await signIn(credentials);
    if (result.status !== "complete") {
      // A readable message, never a raw code like OTHER_ERROR.
      const [message, vars] = authErrorMessage(result.userError);
      setError(t(message, vars));
      return;
    }
    router.push(safeNext(next));
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      {/* The desk: what's waiting on the other side. */}
      <section
        aria-label={t("Booktion'da yazmak")}
        className="relative hidden overflow-hidden border-r border-border bg-[linear-gradient(180deg,var(--surface)_0%,var(--caramel-soft)_100%)] lg:flex lg:flex-col"
      >
        <BranchField
          className="absolute inset-0 h-full w-full"
          roots={8}
          maxBranches={160}
          originY={1}
          style={branchMask}
        />
        <div className="grain pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-multiply" />

        <div className="relative px-10 pt-8 xl:px-14">
          <Link href="/" className="text-2xl">
            <Wordmark />
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-10 py-12 xl:px-14">
          <div className="relative w-full max-w-[30rem]">
            <EditorPreview />
            <SpeedPreview />
          </div>
        </div>

        <div className="relative bg-[linear-gradient(to_top,var(--caramel-soft)_45%,transparent)] px-10 pb-10 pt-16 xl:px-14">
          <p className="anim-rise max-w-md font-display text-[1.7rem] leading-snug text-foreground" style={delay(0.3)}>
            {t("Romanın, köşe yazın, günlüğün —")}{" "}
            <em className="text-accent">{t("her birinin kendi masası var.")}</em>
          </p>
        </div>
      </section>

      {/* The form. */}
      <section className="relative flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl lg:invisible">
            <Wordmark />
          </Link>
          <Link href="/" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
            ← {t("Booktion'u tanı")}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[24rem]">
            <p className="anim-rise text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">
              {next ? t("Kaldığın yere dönmek için") : t("Giriş ya da kayıt")}
            </p>
            <h1
              className="anim-rise mt-3 font-display text-[2.6rem] leading-[1.05] text-foreground sm:text-5xl"
              style={delay(0.06)}
            >
              {t("Masana hoş geldin.")}
            </h1>
            <p className="anim-rise mt-4 leading-relaxed text-muted" style={delay(0.12)}>
              {signingUpNow
                ? t("Bir kullanıcı adı ve şifre seç; hesabın hemen açılır.")
                : t("Kullanıcı adın ve şifrenle gir.")}
            </p>

            <div
              role="tablist"
              aria-label={t("Giriş ya da kayıt")}
              className="anim-rise mt-8 grid grid-cols-2 rounded-md border border-border bg-surface p-1 text-sm"
              style={delay(0.15)}
            >
              {(["signIn", "signUp"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={mode === option}
                  onClick={() => switchMode(option)}
                  className={`h-9 rounded-[5px] font-medium transition-colors ${
                    mode === option ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"
                  }`}
                >
                  {option === "signIn" ? t("Giriş yap") : t("Hesap aç")}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="anim-rise mt-6" style={delay(0.18)}>
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                {t("Kullanıcı adı")}
              </label>
              <div className={`${field} ${error ? "border-red-400" : "border-border hover:border-border-hover"}`}>
                <span aria-hidden="true" className="pl-4 pr-1 font-display text-lg text-muted">
                  @
                </span>
                <input
                  ref={usernameRef}
                  id="username"
                  name="username"
                  autoFocus
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="selinaras"
                  aria-invalid={error !== null}
                  aria-describedby={error ? "auth-error" : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent pr-4 text-[17px] text-foreground outline-none placeholder:text-muted/60"
                />
              </div>

              <label htmlFor="password" className="mt-5 block text-sm font-medium text-foreground">
                {t("Şifre")}
              </label>
              <div className={`${field} ${error ? "border-red-400" : "border-border hover:border-border-hover"}`}>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signingUpNow ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={error !== null}
                  aria-describedby={error ? "auth-error" : signingUpNow ? "password-hint" : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent px-4 text-[17px] text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-pressed={showPassword}
                  className="mr-2 rounded px-2 py-1 text-xs text-muted hover:text-foreground"
                >
                  {showPassword ? t("Gizle") : t("Göster")}
                </button>
              </div>
              {signingUpNow && !error && (
                <p id="password-hint" className="mt-2 text-xs text-muted">
                  {t("En az 10 karakter. Başka bir yerde kullanmadığın bir şifre seç.")}
                </p>
              )}
              {error && (
                <p id="auth-error" role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="group mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent text-[15px] font-medium text-accent-contrast shadow-[0_10px_24px_-14px_rgba(38,66,139,0.9)] transition-colors hover:bg-accent-hover disabled:cursor-wait"
              >
                {pending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-contrast/30 border-t-accent-contrast" />
                    {signingUpNow ? t("Hesabın açılıyor…") : t("Giriş yapılıyor…")}
                  </>
                ) : (
                  <>
                    {signingUpNow ? t("Hesabı aç") : t("Giriş yap")}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            <ul className="anim-rise mt-8 space-y-2.5 lg:hidden" style={delay(0.3)}>
              {promises.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-muted">
                  <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-caramel" />
                  {t(line)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="hidden flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted lg:flex">
          {promises.map((line) => (
            <li key={line} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-caramel" />
              {t(line)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

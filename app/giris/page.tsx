"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignInWithUsernamePasskey } from "@convex-dev/auth/methods/username-passkey/react";
import { api } from "@/convex/_generated/api";
import BranchField from "@/components/BranchField";
import Wordmark from "@/components/Wordmark";
import { safeNext } from "@/lib/safeNext";
import { useT } from "@/lib/i18n";
import { passkeyErrorMessage } from "@/lib/passkeyErrors";

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
  "Şifre yok — cihazının kilidiyle girersin",
  "Yazdıkça taslağın kendiliğinden kaydedilir",
  "Notların ve gizli yazıların yalnızca sana görünür",
];

function PasskeyGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-caramel">
      <path
        d="M12 3.5a6.5 6.5 0 0 0-6.5 6.5c0 2.2.5 4.3 1.4 6.2M12 3.5a6.5 6.5 0 0 1 6.5 6.5c0 1.6-.2 3.2-.6 4.7M8.6 18.4A13 13 0 0 1 8.5 10a3.5 3.5 0 0 1 7 0c0 3.1-.5 6.1-1.5 8.9M12 10c0 4-.6 7.6-2 10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SignInPage() {
  const { signIn, pending } = useSignInWithUsernamePasskey(api.auth);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const t = useT();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (username.trim().length === 0) {
      setError(t("Önce bir kullanıcı adı yaz."));
      inputRef.current?.focus();
      return;
    }
    const result = await signIn({ username: username.trim() });
    if (result.status !== "complete") {
      setError(
        // A readable message, never a raw code like OTHER_ERROR.
        result.userError
          ? t(passkeyErrorMessage(result.userError))
          : t("Giriş tamamlanamadı. Cihazının onay penceresini kapatmış olabilirsin; tekrar dene."),
      );
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
              {t("Kullanıcı adını yaz; gerisini cihazın halleder. Hesabın yoksa aynı adımda açılır.")}
            </p>

            <form onSubmit={handleSubmit} noValidate className="anim-rise mt-9" style={delay(0.18)}>
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                {t("Kullanıcı adı")}
              </label>
              <div
                className={`mt-2 flex h-12 items-center rounded-md border bg-surface transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)] ${
                  error ? "border-red-400" : "border-border hover:border-border-hover"
                }`}
              >
                <span aria-hidden="true" className="pl-4 pr-1 font-display text-lg text-muted">
                  @
                </span>
                <input
                  ref={inputRef}
                  id="username"
                  autoFocus
                  autoComplete="username webauthn"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="selinaras"
                  aria-invalid={error !== null}
                  aria-describedby={error ? "username-error" : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent pr-4 text-[17px] text-foreground outline-none placeholder:text-muted/60"
                />
              </div>
              {error && (
                <p id="username-error" role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="group mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent text-[15px] font-medium text-accent-contrast shadow-[0_10px_24px_-14px_rgba(38,66,139,0.9)] transition-colors hover:bg-accent-hover disabled:cursor-wait"
              >
                {pending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-contrast/30 border-t-accent-contrast" />
                    {t("Cihazının onayı bekleniyor…")}
                  </>
                ) : (
                  <>
                    {t("Devam et")}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="anim-rise mt-8 flex items-start gap-3 rounded-md border border-border bg-surface/70 px-4 py-3" style={delay(0.24)}>
              <PasskeyGlyph />
              <p className="text-[13px] leading-relaxed text-muted">
                <span className="font-medium text-foreground">{t("Passkey ile giriş.")}</span>{" "}
                {t("Parmak izi, yüz tanıma ya da ekran kilidi — hatırlanacak bir şifre yok, çalınacak bir şifre de yok.")}
              </p>
            </div>

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

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAddPasskey, useRemovePasskey } from "@convex-dev/auth/methods/username-passkey/react";
import { api } from "@/convex/_generated/api";
import Loading from "@/components/Loading";
import BackupButton from "@/components/BackupButton";
import { ThemeGrid } from "@/components/ThemePicker";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { passkeyErrorMessage } from "@/lib/passkeyErrors";

type Passkey = { passkeyId: string; credentialId: string; name?: string; createdAt: number };

function dateLabel(at: number) {
  return new Date(at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 3.5a6.5 6.5 0 0 0-6.5 6.5c0 2.2.5 4.3 1.4 6.2M12 3.5a6.5 6.5 0 0 1 6.5 6.5c0 1.6-.2 3.2-.6 4.7M8.6 18.4A13 13 0 0 1 8.5 10a3.5 3.5 0 0 1 7 0c0 3.1-.5 6.1-1.5 8.9M12 10c0 4-.6 7.6-2 10.5" />
    </svg>
  );
}

function PasskeyRow({ passkey, index, canRemove }: { passkey: Passkey; index: number; canRemove: boolean }) {
  const rename = useMutation(api.auth.renamePasskey);
  const { removePasskey, pending } = useRemovePasskey(api.auth);
  const showToast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(passkey.name ?? "");
  const label = passkey.name?.trim() || `Giriş anahtarı ${index + 1}`;

  async function saveName() {
    setEditing(false);
    const next = name.trim();
    if (!next || next === passkey.name) return;
    try {
      const result = await rename({ passkeyId: passkey.passkeyId, name: next });
      if (!result.success) showToast(passkeyErrorMessage(result.userError));
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
  }

  async function remove() {
    const result = await removePasskey(passkey.passkeyId);
    if (result.success) showToast("Anahtar kaldırıldı.", "success");
    else showToast(passkeyErrorMessage(result.userError));
  }

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-caramel-soft text-caramel">
        <KeyIcon />
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => void saveName()}
            onKeyDown={(event) => {
              if (event.key === "Enter") void saveName();
              if (event.key === "Escape") setEditing(false);
            }}
            placeholder="ör. iPhone, iş bilgisayarı"
            className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-[15px] outline-none focus:border-accent"
          />
        ) : (
          <p className="truncate text-[15px] font-medium text-foreground">{label}</p>
        )}
        <p className="mt-0.5 text-xs text-muted">Eklendi: {dateLabel(passkey.createdAt)}</p>
      </div>
      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          Adlandır
        </button>
      )}
      <button
        type="button"
        onClick={() => void remove()}
        disabled={!canRemove || pending}
        title={canRemove ? "Bu anahtarı kaldır" : "Son anahtarın kaldırılamaz"}
        className="text-sm text-muted underline-offset-4 hover:text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
      >
        {pending ? "Kaldırılıyor…" : "Kaldır"}
      </button>
    </li>
  );
}

export default function AccountPage() {
  const me = useQuery(api.users.me);
  const passkeys = useQuery(api.auth.listPasskeys);
  const { addPasskey, pending } = useAddPasskey(api.auth);
  const showToast = useToast();

  async function add() {
    const result = await addPasskey();
    if (result.success) showToast("Yeni giriş anahtarı eklendi. Artık iki yoldan girebilirsin.", "success");
    else showToast(passkeyErrorMessage(result.userError));
  }

  if (me === undefined || passkeys === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Loading />
      </main>
    );
  }

  const list: Passkey[] = passkeys.success ? passkeys.passkeys : [];
  const safe = list.length >= 2;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">Hesap</p>
      <h1 className="mt-2 font-display text-4xl leading-tight">Hesap ve güvenlik</h1>
      {me?.username && (
        <p className="mt-2 text-muted">
          Kullanıcı adın: <span className="font-medium text-foreground">@{me.username}</span>
        </p>
      )}

      {/* Status */}
      <div
        className={`mt-8 flex items-start gap-4 rounded-xl border px-5 py-4 ${
          safe ? "border-[#4f9d69]/40 bg-[#4f9d69]/[0.07]" : "border-caramel/60 bg-caramel-soft"
        }`}
      >
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45 ${safe ? "bg-[#4f9d69]" : "bg-caramel"}`}
        />
        <div>
          <p className="font-medium text-foreground">
            {safe
              ? `Hesabın güvende: ${list.length} farklı yoldan girebilirsin.`
              : "Hesabına yalnızca tek bir cihazla girebiliyorsun."}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {safe
              ? "Bir cihazını kaybetsen bile diğeriyle girip kaybolanı buradan kaldırabilirsin."
              : "Booktion'da şifre yok; giriş anahtarın cihazında saklanıyor. O cihazı kaybedersen hesabına ve yazılarına bir daha giremezsin. İkinci bir cihaz ya da güvenlik anahtarı ekle."}
          </p>
        </div>
      </div>

      {/* Colour theme */}
      <section className="mt-10">
        <h2 className="font-display text-2xl">Renk teması</h2>
        <p className="mt-1 mb-4 text-sm text-muted">Bütün sayfalarda ve yazma ekranında geçerli; hesabınla her cihaza gelir.</p>
        <ThemeGrid />
      </section>

      {/* Passkeys */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Giriş anahtarların</h2>
            <p className="mt-1 text-sm text-muted">Her biri hesabına giren bir cihaz ya da anahtar.</p>
          </div>
          <button
            type="button"
            onClick={() => void add()}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast shadow-[0_10px_24px_-14px_rgba(38,66,139,0.9)] hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Cihazının onayı bekleniyor…" : "+ Cihaz ya da anahtar ekle"}
          </button>
        </div>

        <ul className="mt-5 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {list.map((passkey, index) => (
            <PasskeyRow key={passkey.passkeyId} passkey={passkey} index={index} canRemove={list.length > 1} />
          ))}
        </ul>

        <details className="mt-4 rounded-xl border border-border px-5 py-4 text-sm">
          <summary className="cursor-pointer select-none font-medium text-foreground">
            Telefonumu nasıl eklerim?
          </summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-relaxed text-muted">
            <li>Bu sayfada “Cihaz ya da anahtar ekle”ye bas ve önce bu cihazla onay ver.</li>
            <li>
              Açılan pencerede “Başka bir cihaz kullan” ya da “Telefon veya tablet”i seç; ekranda bir
              QR kodu çıkar.
            </li>
            <li>Telefonunun kamerasıyla QR kodu okut ve telefonda onay ver.</li>
            <li>Bitti: artık telefonunla da girebilirsin. Ona burada bir ad verebilirsin.</li>
          </ol>
          <p className="mt-3 leading-relaxed text-muted">
            iCloud Anahtar Zinciri ya da Google Şifre Yöneticisi kullanıyorsan anahtarın aynı hesaptaki
            cihazlarına zaten eşitlenir; yine de ayrı bir cihaz eklemek en sağlam yoldur.
          </p>
        </details>
      </section>

      {/* Backup */}
      <section className="mt-12">
        <h2 className="font-display text-2xl">Yazılarının yedeği</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Bütün yazılarını, her biri ayrı bir Markdown dosyası olarak tek bir ZIP içinde indir.
          Notların ve taslakların da dahil; ne olursa olsun metnin sende kalır.
        </p>
        <div className="mt-4">
          <BackupButton />
        </div>
      </section>
    </main>
  );
}

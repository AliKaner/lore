"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { errorText } from "@/components/entity/shared";
import { useT } from "@/lib/i18n";

// Who writes this writing: its owner and the co-authors they added.
export default function CoAuthors({ bookId }: { bookId: Id<"books"> }) {
  const t = useT();
  const router = useRouter();
  const data = useQuery(api.members.list, { bookId });
  const me = useQuery(api.users.me);
  const add = useMutation(api.members.add);
  const remove = useMutation(api.members.remove);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!data) return null;

  return (
    <section className="mt-10">
      <h2 className="font-medium">{t("Yazarlar")}</h2>
      <p className="mt-1 text-sm text-muted">
        {t("Ortak yazarlar bu yazıyı gizli olsa da görür, bölüm yazar, panoda plan yapar ve bölümlere değişiklik önerir. Ana hattı ve birleştirmeyi sen yönetirsin.")}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {data.people.map((person) => (
          <li key={person.userId} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1.5 text-sm">
            <span>@{person.username ?? "—"}</span>
            {person.owner ? (
              <span className="rounded-full bg-caramel-soft px-2 text-[11px] text-foreground/80">{t("sahibi")}</span>
            ) : data.viewerIsOwner ? (
              <button
                type="button"
                aria-label={t("{name} yazarlardan çıkar", { name: person.username ?? "" })}
                onClick={() => void remove({ bookId, userId: person.userId }).catch((err) => setError(errorText(err)))}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs text-muted hover:bg-accent-soft hover:text-foreground"
              >
                ✕
              </button>
            ) : person.userId === me?._id ? (
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(t("Bu yazıdan ayrılmak istiyor musun? Yazdığın bölümler kalır."))) return;
                  void remove({ bookId, userId: person.userId })
                    .then(() => router.push("/my-writing"))
                    .catch((err) => setError(errorText(err)));
                }}
                className="rounded-full px-2 text-xs text-muted hover:text-foreground"
              >
                {t("Ayrıl")}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {data.viewerIsOwner && (
        <form
          className="mt-3 flex max-w-sm gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) return;
            setBusy(true);
            setError(null);
            try {
              await add({ bookId, username: name });
              setName("");
            } catch (err) {
              setError(t(errorText(err)));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("kullanıcı adı")}
              aria-label={t("Ortak yazar ekle")}
              className="h-9 w-full rounded-full border border-border bg-surface pl-7 pr-3 text-sm outline-none focus:border-accent"
            />
          </div>
          <button type="submit" disabled={busy} className="h-9 rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast disabled:opacity-50">
            {t("Ekle")}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </section>
  );
}

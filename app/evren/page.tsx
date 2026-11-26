"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ENTITY_KINDS, ENTITY_KIND_ORDER, kindFromSlug, type EntityKind } from "@/convex/entityKinds";
import { KindGlyph, errorText, eyebrow } from "@/components/entity/shared";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";
import { useToast } from "@/components/Toaster";
import { buttonPrimary } from "@/lib/ui";

const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

function NewEntity({ initialKind, onClose }: { initialKind: EntityKind; onClose: () => void }) {
  const createEntity = useMutation(api.entities.create);
  const router = useRouter();
  const showToast = useToast();
  const [kind, setKind] = useState<EntityKind>(initialKind);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length === 0) return;
    setBusy(true);
    try {
      const id = await createEntity({ kind, name });
      router.push(`/evren/${id}`);
    } catch (err) {
      showToast(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="menu-pop mt-6 rounded-2xl border border-border bg-surface p-5 shadow-[0_24px_60px_-40px_rgba(15,25,57,0.55)]">
      <p className={`${eyebrow} text-caramel`}>Ne ekliyorsun?</p>
      <div role="radiogroup" aria-label="Türü" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ENTITY_KIND_ORDER.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={kind === option}
            onClick={() => setKind(option)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
              kind === option
                ? "border-accent bg-accent-soft/60 font-medium"
                : "border-border hover:border-border-hover hover:bg-background"
            }`}
          >
            <KindGlyph kind={option} />
            {ENTITY_KINDS[option].label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={ENTITY_KINDS[kind].namePlaceholder}
          aria-label="Adı"
          className="h-11 flex-1 rounded-xl border border-border bg-background px-4 font-display text-xl outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-xl px-4 text-sm text-muted hover:text-foreground">
            Vazgeç
          </button>
          <button disabled={busy || name.trim().length === 0} className={`${buttonPrimary} h-11 rounded-xl`}>
            {busy ? "Oluşturuluyor…" : "Oluştur ve doldur"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Universe() {
  const params = useSearchParams();
  const router = useRouter();
  const kind = kindFromSlug(params.get("tur"));
  const all = useQuery(api.entities.listMine, {});
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(params.get("yeni") !== null);

  const counts = useMemo(() => {
    const map = new Map<EntityKind, number>();
    for (const entity of all ?? []) map.set(entity.kind, (map.get(entity.kind) ?? 0) + 1);
    return map;
  }, [all]);

  const shown = (all ?? []).filter(
    (entity) => (kind === null || entity.kind === kind) && (query === "" || lower(entity.name).includes(lower(query))),
  );

  function pick(next: EntityKind | null) {
    router.replace(next ? `/evren?tur=${ENTITY_KINDS[next].slug}` : "/evren", { scroll: false });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={`${eyebrow} text-caramel`}>Evrenin</p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Karakterler, yerler ve fazlası</h1>
          <p className="mt-3 max-w-xl text-muted">
            Hikâyelerindeki her adın kendi sayfası: kim kimin çocuğu, hangi krallığa bağlı, haritası, silahı.
            Bir kere oluştur, istediğin yazıda kullan.
          </p>
        </div>
        {!creating && (
          <button type="button" onClick={() => setCreating(true)} className={`${buttonPrimary} h-11 shrink-0 rounded-xl px-5`}>
            + Yeni ekle
          </button>
        )}
      </div>

      {creating && <NewEntity initialKind={kind ?? "character"} onClose={() => setCreating(false)} />}

      <div className="mt-10 flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Türler" className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
          {[null, ...ENTITY_KIND_ORDER].map((option) => {
            const count = option === null ? (all?.length ?? 0) : (counts.get(option) ?? 0);
            const active = option === kind;
            return (
              <button
                key={option ?? "all"}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => pick(option)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active ? "bg-ink text-on-ink" : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
                }`}
              >
                {option === null ? "Tümü" : ENTITY_KINDS[option].plural}
                {count > 0 && <span className={`text-xs tabular-nums ${active ? "text-on-ink/60" : "text-muted/70"}`}>{count}</span>}
              </button>
            );
          })}
        </nav>
        {(all?.length ?? 0) > 0 && (
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ada göre ara"
            aria-label="Ada göre ara"
            className="h-9 w-full rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-accent md:w-60"
          />
        )}
      </div>

      {all === undefined ? (
        <Loading />
      ) : shown.length === 0 ? (
        <div className="mt-10">
          <EmptyState compact art="cast" title={kind ? `Henüz ${lower(ENTITY_KINDS[kind].plural)} yok` : query ? "Bu adla bir şey yok" : "Evrenin henüz boş"}>
            <p>
              “Yeni ekle”ye bas ya da yazarken bir adı seç, sağ tıkla ve kaydet. Bir yazıya eklediğin her ad metinde
              vurgulanır.
            </p>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((entity) => (
            <li key={entity._id}>
              <Link href={`/evren/${entity._id}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-surface transition-[border-color,box-shadow,translate] duration-300 group-hover:-translate-y-0.5 group-hover:border-border-hover group-hover:shadow-[0_22px_40px_-30px_rgba(15,25,57,0.6)]">
                  {entity.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entity.coverUrl} alt="" className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center bg-[radial-gradient(circle_at_50%_40%,var(--accent-soft),transparent_70%)]">
                      <KindGlyph kind={entity.kind} size="lg" />
                    </div>
                  )}
                </div>
                <p className={`${eyebrow} mt-3 text-muted`}>{ENTITY_KINDS[entity.kind].label}</p>
                <h2 className="mt-1 font-display text-2xl leading-tight group-hover:text-accent">{entity.name}</h2>
                {entity.summary && <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted">{entity.summary}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function UniversePage() {
  return (
    <Suspense fallback={<Loading />}>
      <Universe />
    </Suspense>
  );
}

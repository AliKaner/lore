"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ENTITY_KINDS, ENTITY_KIND_ORDER, type EntityKind } from "@/convex/entityKinds";
import EntityEditor from "@/components/entity/EntityEditor";
import { KindGlyph, errorText, eyebrow } from "@/components/entity/shared";
import { useToast } from "@/components/Toaster";

const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

// The writing's world, beside the text: everything named in it, opened and
// filled in without leaving the page.
export default function EntityDrawer({
  bookId,
  open,
  onClose,
  openId: openIdProp,
  onOpenId,
}: {
  bookId: Id<"books">;
  open: boolean;
  onClose: () => void;
  // Lets the page open a given entry (a card on the side board, say).
  openId?: Id<"entities"> | null;
  onOpenId?: (id: Id<"entities"> | null) => void;
}) {
  const inBook = useQuery(api.entities.listForBook, open ? { bookId } : "skip");
  const mine = useQuery(api.entities.listMine, open ? {} : "skip");
  const createEntity = useMutation(api.entities.create);
  const attachToBook = useMutation(api.entities.attachToBook);
  const showToast = useToast();
  const [innerId, setInnerId] = useState<Id<"entities"> | null>(null);
  const openId = openIdProp !== undefined ? openIdProp : innerId;
  const setOpenId = onOpenId ?? setInnerId;
  const [newKind, setNewKind] = useState<EntityKind>("character");
  const [newName, setNewName] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (openId) setOpenId(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openId, onClose, setOpenId]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    try {
      const id = await createEntity({ kind: newKind, name: newName, bookId });
      setNewName("");
      setOpenId(id);
    } catch (err) {
      showToast(errorText(err));
    }
  }

  const inBookIds = new Set((inBook ?? []).map((e) => e._id));
  const fromUniverse = (mine ?? [])
    .filter((e) => !inBookIds.has(e._id))
    .filter((e) => query.trim().length > 0 && lower(e.name).includes(lower(query.trim())))
    .slice(0, 6);

  return (
    <aside
      aria-label="Evren"
      aria-hidden={!open}
      inert={!open}
      className={`fixed inset-y-0 right-0 z-50 flex w-[min(40rem,100vw)] flex-col border-l border-border bg-background transition-[translate,visibility,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        open ? "visible translate-x-0 shadow-[-24px_0_60px_-40px_rgba(15,25,57,0.5)]" : "invisible translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-4">
        {openId ? (
          <button type="button" onClick={() => setOpenId(null)} className="text-sm text-muted hover:text-foreground">
            ← Bu yazının evreni
          </button>
        ) : (
          <div>
            <p className={`${eyebrow} text-caramel`}>Bu yazının</p>
            <h2 className="font-display text-2xl">Evreni</h2>
          </div>
        )}
        <div className="flex items-center gap-1">
          {openId && (
            <a
              href={`/evren/${openId}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-3 py-1.5 text-xs text-muted hover:bg-accent-soft/60 hover:text-foreground"
            >
              Tam sayfa ↗
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Evreni kapat"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft/60 hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {openId ? (
          <div className="px-6 py-6">
            <EntityEditor
              key={openId}
              entityId={openId}
              bookId={bookId}
              compact
              onOpenEntity={setOpenId}
              onDeleted={() => setOpenId(null)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-8 px-5 py-5">
            <form onSubmit={create} className="rounded-2xl border border-border bg-surface p-4">
              <p className={`${eyebrow} text-muted`}>Yeni ekle</p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {ENTITY_KIND_ORDER.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={kind === newKind}
                    onClick={() => setNewKind(kind)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                      kind === newKind ? "bg-ink text-on-ink" : "bg-accent-soft/50 text-muted hover:text-foreground"
                    }`}
                  >
                    <span aria-hidden="true" className="text-[10px]">{ENTITY_KINDS[kind].glyph}</span>
                    {ENTITY_KINDS[kind].label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder={ENTITY_KINDS[newKind].namePlaceholder}
                  aria-label="Adı"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 font-display text-lg outline-none focus:border-accent"
                />
                <button
                  disabled={!newName.trim()}
                  className="h-10 rounded-xl bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-hover disabled:opacity-40"
                >
                  Ekle
                </button>
              </div>
            </form>

            {inBook === undefined ? null : inBook.length === 0 ? (
              <p className="px-1 text-sm leading-relaxed text-muted">
                Henüz bir şey yok. Yukarıdan ekle ya da metinde bir adı seçip sağ tıkla.
              </p>
            ) : (
              ENTITY_KIND_ORDER.filter((kind) => inBook.some((e) => e.kind === kind)).map((kind) => (
                <section key={kind}>
                  <h3 className={`${eyebrow} px-1 text-muted`}>{ENTITY_KINDS[kind].plural}</h3>
                  <ul className="mt-2">
                    {inBook
                      .filter((e) => e.kind === kind)
                      .map((entity) => (
                        <li key={entity._id}>
                          <button
                            type="button"
                            onClick={() => setOpenId(entity._id)}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface"
                          >
                            {entity.coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={entity.coverUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                                <KindGlyph kind={entity.kind} />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-display text-lg leading-tight">{entity.name}</span>
                              {entity.summary && <span className="block truncate text-sm text-muted">{entity.summary}</span>}
                            </span>
                            <span aria-hidden="true" className="text-muted">›</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </section>
              ))
            )}

            {(mine?.length ?? 0) > (inBook?.length ?? 0) && (
              <section className="border-t border-border pt-6">
                <h3 className={`${eyebrow} px-1 text-muted`}>Evreninden ekle</h3>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Başka bir yazıdaki karakter, ülke…"
                  aria-label="Evreninde ara"
                  className="mt-2 h-9 w-full rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-accent"
                />
                <ul className="mt-2">
                  {fromUniverse.map((entity) => (
                    <li key={entity._id} className="flex items-center gap-3 px-2 py-1.5">
                      <KindGlyph kind={entity.kind} />
                      <span className="min-w-0 flex-1 truncate">{entity.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          void attachToBook({ bookId, entityId: entity._id }).catch((err) => showToast(errorText(err)))
                        }
                        className="rounded-full px-3 py-1 text-xs text-accent hover:bg-accent-soft/60"
                      >
                        + Bu yazıya ekle
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

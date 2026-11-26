"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ENTITY_KINDS,
  LIMITS,
  type EntityField,
  type EntitySection,
  type ImageField,
} from "@/convex/entityKinds";
import LinkPicker from "@/components/entity/LinkPicker";
import { EntityChip, KindGlyph, errorText, eyebrow, useImageUpload, type Chip } from "@/components/entity/shared";
import DeleteButton from "@/components/DeleteButton";
import Loading from "@/components/Loading";
import NotFoundState from "@/components/NotFoundState";
import { useToast } from "@/components/Toaster";

type Entity = NonNullable<FunctionReturnType<typeof api.entities.get>>;
type Draft = {
  name: string;
  summary: string;
  fields: Record<string, string>;
  custom: { label: string; value: string }[];
};
type Patch = Partial<Omit<Draft, "fields">> & { fields?: Record<string, string> };
type SaveState = "idle" | "saving" | "saved" | "error";

const SAVE_DELAY = 700;

// Collects edits and saves them a moment after the writer stops typing.
function useAutosave(entityId: Id<"entities">) {
  const update = useMutation(api.entities.update);
  const pending = useRef<Patch>({});
  const timer = useRef<number | undefined>(undefined);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function flush() {
    window.clearTimeout(timer.current);
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return;
    try {
      await update({ entityId, ...patch });
      setState("saved");
      setError(null);
    } catch (err) {
      setState("error");
      setError(errorText(err));
    }
  }

  function queue(patch: Patch) {
    const current = pending.current;
    pending.current = {
      ...current,
      ...patch,
      ...(patch.fields ? { fields: { ...current.fields, ...patch.fields } } : {}),
    };
    setState("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), SAVE_DELAY);
  }

  // Whatever is still waiting goes out when the editor closes.
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => () => void flushRef.current(), []);

  return { queue, flush, state, error };
}

/* ---------- Small controls ---------- */

const lineInput =
  "w-full bg-transparent py-1.5 text-[15px] outline-none placeholder:text-muted/45 focus:placeholder:text-muted/70";

function Row({ label, children, stacked }: { label: string; children: ReactNode; stacked?: boolean }) {
  return (
    <div
      className={`border-b border-border/70 py-1.5 last:border-b-0 ${
        stacked ? "flex flex-col gap-0.5" : "grid grid-cols-1 gap-x-6 sm:grid-cols-[10rem_1fr] sm:items-baseline"
      }`}
    >
      <span className="pt-1.5 text-sm text-muted">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function LongText({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}) {
  return (
    <textarea
      value={value}
      aria-label={label}
      maxLength={LIMITS.longtext}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ?? "Yazmaya başla…"}
      rows={2}
      className={`${lineInput} min-h-[3.25rem] resize-none leading-relaxed [field-sizing:content]`}
    />
  );
}

function Lifespan({
  age,
  birthYear,
  onChange,
}: {
  age: string;
  birthYear: string;
  onChange: (fields: Record<string, string>) => void;
}) {
  const [mode, setMode] = useState<"age" | "birthYear">(birthYear && !age ? "birthYear" : "age");
  const value = mode === "age" ? age : birthYear;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="radiogroup" aria-label="Yaşı ya da doğum yılı" className="inline-flex rounded-full bg-accent-soft/60 p-0.5 text-xs">
        {(["age", "birthYear"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => {
              if (option === mode) return;
              // The value carries over; the other way of saying it is cleared.
              onChange(option === "age" ? { age: value, birthYear: "" } : { birthYear: value, age: "" });
              setMode(option);
            }}
            className={`rounded-full px-3 py-1 transition-colors ${
              mode === option ? "bg-surface font-medium text-foreground shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {option === "age" ? "Yaş" : "Doğum yılı"}
          </button>
        ))}
      </div>
      <input
        value={value}
        aria-label={mode === "age" ? "Yaşı" : "Doğum yılı"}
        maxLength={LIMITS.text}
        onChange={(event) =>
          onChange(mode === "age" ? { age: event.target.value } : { birthYear: event.target.value })
        }
        placeholder={mode === "age" ? "24" : "Ay Takvimi 318"}
        className={`${lineInput} max-w-[14rem] flex-1`}
      />
    </div>
  );
}

function ImageSlot({
  field,
  image,
  onUpload,
  onRemove,
}: {
  field: ImageField;
  image: Entity["images"][number] | undefined;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  async function take(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file);
    } finally {
      setBusy(false);
    }
  }
  if (image?.url) {
    return (
      <figure className="group relative overflow-hidden rounded-xl border border-border bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt={field.label} className="max-h-[28rem] w-full object-contain" />
        <figcaption className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <a href={image.url} target="_blank" rel="noreferrer" className="rounded-full bg-ink/80 px-3 py-1 text-xs text-on-ink backdrop-blur hover:bg-ink">
            Büyüt
          </a>
          <label className="cursor-pointer rounded-full bg-ink/80 px-3 py-1 text-xs text-on-ink backdrop-blur hover:bg-ink">
            Değiştir
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => void take(event.target.files?.[0])} />
          </label>
          <button type="button" onClick={onRemove} className="rounded-full bg-ink/80 px-3 py-1 text-xs text-on-ink backdrop-blur hover:bg-red-800">
            Kaldır
          </button>
        </figcaption>
      </figure>
    );
  }
  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void take(event.dataTransfer.files[0]);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
        dragging ? "border-accent bg-accent-soft/60" : "border-border-hover hover:border-accent hover:bg-accent-soft/30"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 text-muted" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z M9 4v13.5 M15 6.5V20" />
      </svg>
      <span className="text-sm font-medium">{busy ? "Yükleniyor…" : field.hint}</span>
      <span className="text-xs text-muted">Sürükle bırak ya da tıkla · en fazla 10 MB</span>
      <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(event) => void take(event.target.files?.[0])} />
    </label>
  );
}

/* ---------- Gallery ---------- */

function Gallery({
  entity,
  onUpload,
  onRemove,
  onMakeCover,
}: {
  entity: Entity;
  onUpload: (files: File[]) => Promise<void>;
  onRemove: (storageId: Id<"_storage">) => void;
  onMakeCover: (storageId: Id<"_storage">) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pictures = entity.images.filter((image) => image.slot === null);
  const [portrait, ...rest] = pictures;

  async function take(files: FileList | null | undefined) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      await onUpload([...files]);
    } finally {
      setBusy(false);
    }
  }

  const picker = (
    <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={(event) => void take(event.target.files)} />
  );

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void take(event.dataTransfer.files);
      }}
      className={`rounded-2xl transition-shadow ${dragging ? "ring-2 ring-accent ring-offset-4 ring-offset-background" : ""}`}
    >
      {portrait?.url ? (
        <figure className="group relative overflow-hidden rounded-2xl border border-border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portrait.url} alt={entity.name} className="aspect-[4/5] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-ink/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <a href={portrait.url} target="_blank" rel="noreferrer" className="rounded-full bg-ink/70 px-3 py-1 text-xs text-on-ink backdrop-blur hover:bg-ink">
              Büyüt
            </a>
            <button type="button" onClick={() => onRemove(portrait.storageId)} className="rounded-full bg-ink/70 px-3 py-1 text-xs text-on-ink backdrop-blur hover:bg-red-800">
              Kaldır
            </button>
          </div>
        </figure>
      ) : (
        <label className="flex aspect-[16/10] w-full cursor-pointer flex-col sm:aspect-[4/5] items-center justify-center gap-3 rounded-2xl border border-dashed border-border-hover bg-surface text-center transition-colors hover:border-accent hover:bg-accent-soft/30">
          <KindGlyph kind={entity.kind} size="lg" />
          <span className="text-sm font-medium">{busy ? "Yükleniyor…" : "Görsel ekle"}</span>
          <span className="px-6 text-xs leading-relaxed text-muted">
            Birden fazla seçebilir ya da buraya sürükleyebilirsin. İlki kapak olur.
          </span>
          {picker}
        </label>
      )}

      {portrait && (
        <ul className="mt-2 grid grid-cols-4 gap-2">
          {rest.map((image) => (
            <li key={image.storageId} className="group relative overflow-hidden rounded-lg border border-border">
              {image.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.url} alt="" className="aspect-square w-full object-cover" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/60 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button type="button" onClick={() => onMakeCover(image.storageId)} className="text-[11px] font-medium text-on-ink hover:text-caramel">
                  Kapak yap
                </button>
                <button type="button" onClick={() => onRemove(image.storageId)} className="text-[11px] text-on-ink/80 hover:text-red-300">
                  Kaldır
                </button>
              </div>
            </li>
          ))}
          {pictures.length < LIMITS.images && (
            <li>
              <label
                title="Görsel ekle"
                className="flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-border-hover text-xl text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" /> : "+"}
                {picker}
              </label>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/* ---------- Editor ---------- */

function SaveBadge({ state, error }: { state: SaveState; error: string | null }) {
  if (state === "idle") return null;
  const label = { saving: "Kaydediliyor…", saved: "Kaydedildi", error: error ?? "Kaydedilemedi" }[state];
  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs ${state === "error" ? "text-red-700 dark:text-red-300" : "text-muted"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          state === "saving" ? "animate-pulse bg-caramel" : state === "saved" ? "bg-emerald-500" : "bg-red-600"
        }`}
      />
      {label}
    </span>
  );
}

function filledCount(section: EntitySection, entity: Entity, draft: Draft) {
  return section.fields.filter((field) => {
    if (field.type === "link") return (entity.links[field.key] ?? []).length > 0;
    if (field.type === "image") return entity.images.some((image) => image.slot === field.key);
    if (field.type === "lifespan") return Boolean(draft.fields.age || draft.fields.birthYear);
    return Boolean(draft.fields[field.key]);
  }).length;
}

function EditorBody({
  entity,
  bookId,
  compact,
  onOpenEntity,
  afterDelete,
  onDeleted,
}: {
  entity: Entity;
  bookId?: Id<"books">;
  compact?: boolean;
  onOpenEntity: (id: Id<"entities">) => void;
  afterDelete?: () => string;
  onDeleted?: () => void;
}) {
  const config = ENTITY_KINDS[entity.kind];
  const mine = useQuery(api.entities.listMine, {});
  const myBooks = useQuery(api.books.listMine, compact ? "skip" : {});
  const setLinks = useMutation(api.entities.setLinks);
  const createEntity = useMutation(api.entities.create);
  const addImage = useMutation(api.entities.addImage);
  const removeImage = useMutation(api.entities.removeImage);
  const makeCover = useMutation(api.entities.makeCover);
  const attachToBook = useMutation(api.entities.attachToBook);
  const detachFromBook = useMutation(api.entities.detachFromBook);
  const upload = useImageUpload();
  const showToast = useToast();
  const { queue, flush, state, error } = useAutosave(entity._id);

  const [draft, setDraft] = useState<Draft>(() => ({
    name: entity.name,
    summary: entity.summary ?? "",
    fields: entity.fields,
    custom: entity.custom,
  }));
  const [unfolded, setUnfolded] = useState<Record<string, boolean>>({});

  const candidates: Chip[] | undefined = mine?.map((m) => ({ _id: m._id, kind: m.kind, name: m.name }));

  function setField(fields: Record<string, string>) {
    setDraft((d) => ({ ...d, fields: { ...d.fields, ...fields } }));
    queue({ fields });
  }

  function setCustom(custom: Draft["custom"]) {
    setDraft((d) => ({ ...d, custom }));
    queue({ custom: custom.filter((c) => c.label.trim() || c.value.trim()) });
  }

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (err) {
      showToast(errorText(err));
    }
  }

  async function uploadInto(files: File[], slot?: string) {
    for (const file of files) {
      await run(async () => {
        const storageId = await upload(file);
        await addImage({ entityId: entity._id, storageId, slot });
      });
    }
  }

  function renderField(field: EntityField) {
    switch (field.type) {
      case "text": {
        const listId = field.suggestions ? `${entity._id}-${field.key}` : undefined;
        return (
          <Row key={field.key} label={field.label}>
            <input
              value={draft.fields[field.key] ?? ""}
              aria-label={field.label}
              maxLength={LIMITS.text}
              list={listId}
              onChange={(event) => setField({ [field.key]: event.target.value })}
              placeholder={field.placeholder ?? "—"}
              className={lineInput}
            />
            {listId && (
              <datalist id={listId}>
                {field.suggestions!.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </Row>
        );
      }
      case "longtext":
        return (
          <Row key={field.key} label={field.label} stacked>
            <LongText
              label={field.label}
              value={draft.fields[field.key] ?? ""}
              placeholder={field.placeholder}
              onChange={(value) => setField({ [field.key]: value })}
            />
          </Row>
        );
      case "lifespan":
        return (
          <Row key={field.key} label={field.label}>
            <Lifespan age={draft.fields.age ?? ""} birthYear={draft.fields.birthYear ?? ""} onChange={setField} />
          </Row>
        );
      case "link":
        return (
          <Row key={field.key} label={field.label}>
            <LinkPicker
              field={field}
              value={entity.links[field.key] ?? []}
              selfId={entity._id}
              candidates={candidates}
              onOpen={onOpenEntity}
              onChange={(toIds) => void run(() => setLinks({ entityId: entity._id, role: field.key, toIds }))}
              onCreate={(kind, name) => createEntity({ kind, name, ...(bookId ? { bookId } : {}) })}
            />
          </Row>
        );
      case "image":
        return (
          <div key={field.key} className="py-2">
            <ImageSlot
              field={field}
              image={entity.images.find((image) => image.slot === field.key)}
              onUpload={(file) => uploadInto([file], field.key)}
              onRemove={() => {
                const image = entity.images.find((i) => i.slot === field.key);
                if (image) void run(() => removeImage({ entityId: entity._id, storageId: image.storageId }));
              }}
            />
          </div>
        );
    }
  }

  const family = entity.family;
  const familyRows: [string, Chip[]][] = family
    ? (
        [
          ["Kardeşleri", family.siblings],
          ["Çocukları", family.children],
          ["Büyükanne ve büyükbabaları", family.grandparents],
        ] as [string, Chip[]][]
      ).filter(([, chips]) => chips.length > 0)
    : [];

  const otherBooks = (myBooks ?? []).filter((b) => !entity.books.some((eb) => eb._id === b._id));

  return (
    <div className={compact ? "flex flex-col gap-8" : "grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-14"}>
      <aside
        className={
          compact
            ? "mx-auto w-full max-w-[14rem]"
            : "mx-auto w-full max-w-[18rem] lg:sticky lg:top-8 lg:max-w-none lg:self-start"
        }
      >
        <Gallery
          entity={entity}
          onUpload={(files) => uploadInto(files)}
          onRemove={(storageId) => void run(() => removeImage({ entityId: entity._id, storageId }))}
          onMakeCover={(storageId) => void run(() => makeCover({ entityId: entity._id, storageId }))}
        />
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-4">
          <p className={`${eyebrow} inline-flex items-center gap-2 text-caramel`}>
            <KindGlyph kind={entity.kind} />
            {config.label}
          </p>
          <SaveBadge state={state} error={error} />
        </div>
        <input
          value={draft.name}
          aria-label="Adı"
          maxLength={LIMITS.name}
          onChange={(event) => {
            setDraft((d) => ({ ...d, name: event.target.value }));
            if (event.target.value.trim()) queue({ name: event.target.value });
          }}
          onBlur={() => void flush()}
          placeholder={config.namePlaceholder}
          className={`mt-3 w-full bg-transparent font-display leading-[1.05] tracking-tight outline-none placeholder:text-muted/40 ${
            compact ? "text-4xl" : "text-5xl sm:text-6xl"
          }`}
        />
        <input
          value={draft.summary}
          aria-label="Kısa açıklama"
          maxLength={LIMITS.summary}
          onChange={(event) => {
            setDraft((d) => ({ ...d, summary: event.target.value }));
            queue({ summary: event.target.value });
          }}
          placeholder={config.summaryPlaceholder}
          className="mt-3 w-full bg-transparent font-display text-xl italic text-muted outline-none placeholder:text-muted/45"
        />

        <div className="mt-10 flex flex-col gap-10">
          {config.sections.map((section) => {
            const filled = filledCount(section, entity, draft);
            const isOpen = !section.folded || unfolded[section.title] || false;
            const isFamily = section.fields.some((f) => f.key === "father");
            return (
              <section key={section.title}>
                {section.folded ? (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setUnfolded((u) => ({ ...u, [section.title]: !isOpen }))}
                    className="group flex w-full items-baseline gap-3 border-b border-border pb-2 text-left"
                  >
                    <h2 className="font-display text-2xl">{section.title}</h2>
                    <span className="text-xs text-muted">
                      {filled > 0 ? `${filled} alan dolu` : `${section.fields.length} alan`}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`ml-auto text-muted transition-transform duration-300 group-hover:text-foreground ${isOpen ? "rotate-180" : ""}`}
                    >
                      ⌄
                    </span>
                  </button>
                ) : (
                  <h2 className="border-b border-border pb-2 font-display text-2xl">{section.title}</h2>
                )}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden" inert={!isOpen}>
                    <div className="pt-1">{section.fields.map(renderField)}</div>
                    {isFamily && familyRows.length > 0 && (
                      <div className="mt-3 rounded-xl bg-accent-soft/40 px-4 py-3">
                        <p className={`${eyebrow} text-muted`}>Ailenin geri kalanı</p>
                        {familyRows.map(([label, chips]) => (
                          <div key={label} className="mt-2 grid gap-x-6 sm:grid-cols-[9.5rem_1fr] sm:items-center">
                            <span className="text-sm text-muted">{label}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {chips.map((chip) => (
                                <EntityChip key={chip._id} chip={chip} onOpen={() => onOpenEntity(chip._id)} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}

          <section>
            <h2 className="border-b border-border pb-2 font-display text-2xl">Kendi alanların</h2>
            <div className="pt-1">
              {draft.custom.map((entry, index) => (
                <div key={index} className="group grid grid-cols-1 gap-x-6 border-b border-border/70 py-1.5 sm:grid-cols-[10rem_1fr_auto] sm:items-baseline">
                  <input
                    value={entry.label}
                    aria-label="Alanın adı"
                    maxLength={LIMITS.customLabel}
                    onChange={(event) =>
                      setCustom(draft.custom.map((c, i) => (i === index ? { ...c, label: event.target.value } : c)))
                    }
                    placeholder="Alan adı"
                    className="bg-transparent py-1.5 text-sm text-muted outline-none placeholder:text-muted/45 focus:text-foreground"
                  />
                  <input
                    value={entry.value}
                    aria-label={entry.label || "Değer"}
                    onChange={(event) =>
                      setCustom(draft.custom.map((c, i) => (i === index ? { ...c, value: event.target.value } : c)))
                    }
                    placeholder="—"
                    className={lineInput}
                  />
                  <button
                    type="button"
                    aria-label="Alanı kaldır"
                    onClick={() => setCustom(draft.custom.filter((_, i) => i !== index))}
                    className="justify-self-end px-1 text-sm text-muted opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100 focus:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {draft.custom.length < LIMITS.customFields && (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, custom: [...d.custom, { label: "", value: "" }] }))}
                  className="mt-2 inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/70 hover:text-foreground"
                >
                  + Alan ekle
                </button>
              )}
            </div>
          </section>

          {entity.incoming.length > 0 && (
            <section>
              <h2 className="border-b border-border pb-2 font-display text-2xl">Bağlantıları</h2>
              {entity.incoming.map((group) => (
                <Row key={group.label} label={group.label}>
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {group.items.map((chip) => (
                      <EntityChip key={chip._id} chip={chip} onOpen={() => onOpenEntity(chip._id)} />
                    ))}
                  </div>
                </Row>
              ))}
            </section>
          )}

          {!compact && (
            <section>
              <h2 className="border-b border-border pb-2 font-display text-2xl">Yazılarında</h2>
              <p className="mt-2 text-sm text-muted">
                Dahil olduğu yazılarda adı metinde vurgulanır, okurlar da bu sayfayı görebilir.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {entity.books.map((book) => (
                  <span key={book._id} className="inline-flex items-center gap-1 rounded-full border border-border py-0.5 pl-3 pr-1 text-sm">
                    <a href={`/kitap/${book._id}`} className="hover:text-accent">
                      {book.title}
                    </a>
                    <button
                      type="button"
                      aria-label={`${book.title} yazısından çıkar`}
                      onClick={() => void run(() => detachFromBook({ bookId: book._id, entityId: entity._id }))}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-muted hover:bg-accent-soft hover:text-foreground"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {otherBooks.length > 0 && (
                  <select
                    value=""
                    aria-label="Bir yazıya ekle"
                    onChange={(event) => {
                      const id = event.target.value as Id<"books">;
                      if (id) void run(() => attachToBook({ bookId: id, entityId: entity._id }));
                    }}
                    className="h-8 rounded-full border border-dashed border-border-hover bg-transparent px-3 text-sm text-muted hover:text-foreground"
                  >
                    <option value="">+ Bir yazıya ekle</option>
                    {otherBooks.map((book) => (
                      <option key={book._id} value={book._id}>
                        {book.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </section>
          )}

          <div className="border-t border-border pt-4">
            <DeleteButton
              target={{ kind: "entity", id: entity._id }}
              label={`Bu ${config.label.toLocaleLowerCase("tr-TR")} kaydını sil`}
              afterDelete={afterDelete}
              onDeleted={onDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EntityEditor({
  entityId,
  bookId,
  compact,
  onOpenEntity,
  afterDelete,
  onDeleted,
}: {
  entityId: Id<"entities">;
  bookId?: Id<"books">;
  compact?: boolean;
  onOpenEntity: (id: Id<"entities">) => void;
  afterDelete?: () => string;
  onDeleted?: () => void;
}) {
  const entity = useQuery(api.entities.get, { entityId });
  if (entity === undefined) return <Loading />;
  if (entity === null || !entity.canEdit) {
    return <NotFoundState title="Bu kayıt bulunamadı" />;
  }
  return (
    <EditorBody
      key={entity._id}
      entity={entity}
      bookId={bookId}
      compact={compact}
      onOpenEntity={onOpenEntity}
      afterDelete={afterDelete}
      onDeleted={onDeleted}
    />
  );
}


"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type { EntityKind, LinkField } from "@/convex/entityKinds";
import { EntityChip, KindGlyph, type Chip } from "@/components/entity/shared";
import { useT } from "@/lib/i18n";
import { useEntityKinds } from "@/lib/localized";

const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

type Option =
  | { type: "pick"; chip: Chip }
  | { type: "create"; kind: EntityKind; name: string };

// A link field: the chosen entities as chips, and a search that picks one of
// the writer's own — or makes a new one on the spot ("Elf" → a new race).
export default function LinkPicker({
  field,
  value,
  selfId,
  candidates,
  onChange,
  onCreate,
  onOpen,
}: {
  field: LinkField;
  value: Chip[];
  selfId: Id<"entities">;
  candidates: Chip[] | undefined;
  onChange: (ids: Id<"entities">[]) => void;
  onCreate: (kind: EntityKind, name: string) => Promise<Id<"entities">>;
  onOpen: (id: Id<"entities">) => void;
}) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const t = useT();
  const kinds = useEntityKinds();

  const options = useMemo<Option[]>(() => {
    const q = lower(query.trim());
    const chosen = new Set(value.map((c) => c._id));
    const picks = (candidates ?? [])
      .filter((c) => field.kinds.includes(c.kind) && c._id !== selfId && !chosen.has(c._id))
      .filter((c) => q.length === 0 || lower(c.name).includes(q))
      .slice(0, 7)
      .map((chip): Option => ({ type: "pick", chip }));
    const exact = (candidates ?? []).some((c) => field.kinds.includes(c.kind) && lower(c.name) === q);
    const creates =
      q.length >= 2 && !exact
        ? field.kinds.map((kind): Option => ({ type: "create", kind, name: query.trim() }))
        : [];
    return [...picks, ...creates];
  }, [query, value, candidates, field.kinds, selfId]);

  const canAdd = field.multiple || value.length === 0;

  function open() {
    setQuery("");
    setHighlight(0);
    setSearching(true);
  }

  async function choose(option: Option) {
    const ids = value.map((c) => c._id);
    if (option.type === "pick") {
      onChange(field.multiple ? [...ids, option.chip._id] : [option.chip._id]);
    } else {
      setBusy(true);
      try {
        const id = await onCreate(option.kind, option.name);
        onChange(field.multiple ? [...ids, id] : [id]);
      } finally {
        setBusy(false);
      }
    }
    setQuery("");
    setHighlight(0);
    if (field.multiple) inputRef.current?.focus();
    else setSearching(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      {value.map((chip) => (
        <EntityChip
          key={chip._id}
          chip={chip}
          onOpen={() => onOpen(chip._id)}
          onRemove={() => onChange(value.filter((c) => c._id !== chip._id).map((c) => c._id))}
        />
      ))}
      {canAdd && !searching && (
        <button
          type="button"
          onClick={open}
          className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-sm text-muted transition-colors hover:bg-accent-soft/70 hover:text-foreground"
        >
          <span aria-hidden="true">+</span>
          {value.length === 0 ? t("Seç ya da oluştur") : t("Ekle")}
        </button>
      )}
      {searching && (
        <div className="relative min-w-[14rem] flex-1">
          <input
            ref={inputRef}
            autoFocus
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-label={t("{label} ara", { label: field.label })}
            value={query}
            disabled={busy}
            onChange={(event) => {
              setQuery(event.target.value);
              setHighlight(0);
            }}
            onBlur={() => window.setTimeout(() => setSearching(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlight((h) => Math.min(h + 1, options.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                const option = options[highlight];
                if (option) void choose(option);
              } else if (event.key === "Escape") {
                event.stopPropagation();
                setSearching(false);
              }
            }}
            placeholder={t("{kinds} ara…", { kinds: field.kinds.map((k) => kinds[k].label).join(", ") })}
            className="h-8 w-full rounded-full border border-border-hover bg-surface px-3 text-sm outline-none focus:border-accent"
          />
          {options.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              className="menu-pop absolute left-0 top-full z-30 mt-1.5 w-full min-w-[16rem] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[0_18px_40px_-18px_rgba(15,25,57,0.45)]"
            >
              {options.map((option, index) => (
                <li key={option.type === "pick" ? option.chip._id : `new-${option.kind}`} role="option" aria-selected={index === highlight}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => void choose(option)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                      index === highlight ? "bg-accent-soft/70" : ""
                    } ${option.type === "create" ? "border-t border-border/60 text-accent" : ""}`}
                  >
                    {option.type === "pick" ? (
                      <>
                        <KindGlyph kind={option.chip.kind} />
                        <span className="truncate">{option.chip.name}</span>
                        <span className="ml-auto text-xs text-muted">{kinds[option.chip.kind].label}</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center">+</span>
                        <span className="truncate">
                          {t("“{name}” adında yeni: {kind}", { name: option.name, kind: kinds[option.kind].label })}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

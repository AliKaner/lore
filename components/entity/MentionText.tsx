"use client";

import { Fragment, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { LIMITS, markStyleOf } from "@/convex/entityKinds";
import { activeMention, findMentions } from "@/lib/mentions";
import { EntityChip, KindGlyph, type Chip } from "@/components/entity/shared";
import { useT } from "@/lib/i18n";
import { useEntityKinds } from "@/lib/localized";

const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

// Shared by the textarea and the layer behind it, so both lay text out alike.
const textBox =
  "w-full py-1.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]";

const markTone = {
  character: "bg-caramel-soft shadow-[inset_0_-1.5px_0_var(--caramel)]",
  place: "bg-sapphire-soft shadow-[inset_0_-1.5px_0_var(--sapphire)]",
  thing: "bg-accent-soft shadow-[inset_0_-1.5px_0_var(--accent)]",
};

type Option = { type: "pick"; chip: Chip } | { type: "create"; name: string };

// A long-text field where "@" names another entity of the writer's world.
// The text stays a plain textarea; a layer behind it tints the mentions, a
// menu at the caret offers names, and the mentioned ones sit below as chips.
export default function MentionText({
  value,
  onChange,
  label,
  placeholder,
  candidates,
  selfId,
  onOpen,
  onCreate,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  candidates: Chip[];
  selfId: Id<"entities">;
  onOpen: (id: Id<"entities">) => void;
  onCreate?: (name: string) => Promise<Id<"entities">>;
}) {
  const t = useT();
  const kinds = useEntityKinds();
  const listId = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [caret, setCaret] = useState<number | null>(null);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [menuAt, setMenuAt] = useState<{ left: number; top: number } | null>(null);
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingCaret = useRef<number | null>(null);

  const others = useMemo(() => candidates.filter((c) => c._id !== selfId), [candidates, selfId]);
  const byId = useMemo(() => new Map(candidates.map((c) => [c._id as string, c])), [candidates]);
  const ranges = useMemo(() => findMentions(value, others), [value, others]);

  const active = caret === null ? null : activeMention(value, caret);
  const open = active !== null && active.at !== dismissedAt && !busy;

  const options = useMemo<Option[]>(() => {
    if (!active) return [];
    const q = lower(active.query.trim());
    const matches = others
      .map((chip) => ({ chip, name: lower(chip.name) }))
      .filter(({ name }) => q.length === 0 || name.includes(q))
      .sort((a, b) => {
        const prefix = Number(b.name.startsWith(q)) - Number(a.name.startsWith(q));
        if (prefix !== 0) return prefix;
        const people = Number(b.chip.kind === "character") - Number(a.chip.kind === "character");
        return people !== 0 ? people : a.name.localeCompare(b.name, "tr");
      })
      .slice(0, 7)
      .map(({ chip }): Option => ({ type: "pick", chip }));
    const exact = others.some((c) => lower(c.name) === q);
    const create: Option[] =
      onCreate && q.length >= 2 && !exact ? [{ type: "create", name: active.query.trim() }] : [];
    return [...matches, ...create];
  }, [active, others, onCreate]);

  const showMenu = open && options.length > 0;

  // Put the menu under the "@", measured on the layer behind the textarea.
  useLayoutEffect(() => {
    if (!showMenu || !marker.current || !wrap.current || !area.current) {
      setMenuAt(null);
      return;
    }
    const width = Math.min(288, wrap.current.clientWidth);
    const left = Math.max(0, Math.min(marker.current.offsetLeft, wrap.current.clientWidth - width));
    const lineHeight = parseFloat(getComputedStyle(area.current).lineHeight) || 24;
    const top = marker.current.offsetTop - area.current.scrollTop + lineHeight + 2;
    setMenuAt((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }));
  }, [showMenu, active?.at, value]);

  // After a pick, the caret goes right after the inserted name.
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !area.current) return;
    const at = pendingCaret.current;
    pendingCaret.current = null;
    area.current.focus();
    area.current.setSelectionRange(at, at);
    setCaret(at);
  }, [value]);

  function track() {
    const el = area.current;
    if (!el) return;
    setCaret(el.selectionStart === el.selectionEnd ? el.selectionStart : null);
    if (layer.current) layer.current.scrollTop = el.scrollTop;
  }

  function insert(name: string) {
    if (!active || caret === null) return;
    const before = value.slice(0, active.at);
    const after = value.slice(caret);
    const spacer = after.startsWith(" ") || after.startsWith("\n") ? "" : " ";
    const text = `@${name}${spacer}`;
    pendingCaret.current = before.length + text.length;
    setHighlight(0);
    onChange(before + text + after);
  }

  async function choose(option: Option) {
    if (option.type === "pick") {
      insert(option.chip.name);
      return;
    }
    if (!onCreate) return;
    setBusy(true);
    try {
      await onCreate(option.name);
      insert(option.name);
    } finally {
      setBusy(false);
    }
  }

  // The layer behind: the same text, transparent, with the mentions tinted.
  const layerParts: React.ReactNode[] = [];
  let last = 0;
  const markAt = showMenu && active ? active.at : -1;
  const plain = (from: number, to: number) => {
    if (markAt >= from && markAt < to) {
      layerParts.push(value.slice(from, markAt), <span key="marker" ref={marker} />, value.slice(markAt, to));
    } else {
      layerParts.push(value.slice(from, to));
    }
  };
  for (const range of ranges) {
    plain(last, range.start);
    const chip = byId.get(range.id);
    layerParts.push(
      <mark key={range.start} className={`rounded-[3px] text-transparent ${markTone[markStyleOf(chip?.kind ?? "item")]}`}>
        {value.slice(range.start, range.end)}
      </mark>,
    );
    last = range.end;
  }
  plain(last, value.length);

  const mentioned = [...new Set(ranges.map((r) => r.id))]
    .map((id) => byId.get(id))
    .filter((chip): chip is Chip => chip !== undefined);

  return (
    <div>
      <div ref={wrap} className="relative">
        <div
          ref={layer}
          aria-hidden="true"
          className={`${textBox} pointer-events-none absolute inset-0 overflow-hidden text-transparent`}
        >
          {layerParts.map((part, index) => (typeof part === "string" ? <Fragment key={`t${index}`}>{part}</Fragment> : part))}
          {"​"}
        </div>
        <textarea
          ref={area}
          value={value}
          aria-label={label}
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={listId}
          aria-autocomplete="list"
          maxLength={LIMITS.longtext}
          onChange={(event) => {
            onChange(event.target.value);
            const el = event.target;
            setCaret(el.selectionStart === el.selectionEnd ? el.selectionStart : null);
            setHighlight(0);
          }}
          onSelect={track}
          onScroll={track}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            window.setTimeout(() => setCaret(null), 150);
          }}
          onKeyDown={(event) => {
            if (!showMenu) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlight((h) => Math.min(h + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (event.key === "Enter" || event.key === "Tab") {
              const option = options[highlight];
              if (option) {
                event.preventDefault();
                void choose(option);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setDismissedAt(active?.at ?? null);
            }
          }}
          placeholder={placeholder ?? t("Yazmaya başla…")}
          rows={2}
          className={`${textBox} relative min-h-[3.25rem] resize-none bg-transparent outline-none [field-sizing:content] placeholder:text-muted/45 focus:placeholder:text-muted/70`}
        />
        {showMenu && menuAt && (
          <ul
            id={listId}
            role="listbox"
            style={{ left: menuAt.left, top: menuAt.top }}
            className="menu-pop absolute z-30 w-72 max-w-full overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[0_18px_40px_-18px_rgba(15,25,57,0.45)]"
          >
            {options.map((option, index) => (
              <li key={option.type === "pick" ? option.chip._id : "new"} role="option" aria-selected={index === highlight}>
                <button
                  type="button"
                  tabIndex={-1}
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
                        {t("“{name}” adında yeni: {kind}", { name: option.name, kind: kinds.character.label })}
                      </span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {mentioned.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pb-1.5">
          {mentioned.map((chip) => (
            <EntityChip key={chip._id} chip={chip} onOpen={() => onOpen(chip._id)} />
          ))}
        </div>
      ) : (
        focused &&
        others.length > 0 &&
        !value.includes("@") && (
          <p className="pb-1.5 text-xs text-muted/80">{t("Başka bir kaydı anmak için @ yaz")}</p>
        )
      )}
    </div>
  );
}

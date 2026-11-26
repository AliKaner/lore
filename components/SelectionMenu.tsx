"use client";

import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { getMarkRange, useEditorState, type Editor } from "@tiptap/react";
import { sentenceRangeAt, wordRangeAt, type NameEntry } from "@/lib/editorExtensions";
import { ENTITY_KINDS, ENTITY_KIND_ORDER, markStyleOf, type EntityKind } from "@/convex/entityKinds";

type Mode = "actions" | "note" | "name" | "done";
type Range = { from: number; to: number };
type Anchor = { x: number; y: number; placement: "above" | "pointer" };

type MenuState = {
  mode: Mode;
  range: Range;
  anchor: Anchor;
  // Set when a right-click picked the word itself, so offering the whole
  // sentence makes sense.
  autoWord: boolean;
  message?: string;
};

export type SelectionMenuHandle = { openNote: () => void };

const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

// "Selin'in," → "Selin": a name as the writer means it, without the Turkish
// suffix after the apostrophe or surrounding punctuation.
function cleanName(text: string) {
  return text
    .split("\n")[0]
    .split(/['’]/u)[0]
    .replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, "")
    .replace(/\s+/gu, " ")
    .slice(0, 60);
}

function excerpt(text: string, max = 42) {
  const flat = text.replace(/\s+/gu, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/* ---------- Icons ---------- */

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
const NoteIcon = () => (
  <Icon>
    <path d="M4 3.5h12v9l-4 4H4z" />
    <path d="M12 16.5v-4h4M7 7.5h6M7 10.5h3.5" />
  </Icon>
);
const PersonIcon = () => (
  <Icon>
    <circle cx="10" cy="6.5" r="3" />
    <path d="M4 17c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
  </Icon>
);
const PlaceIcon = () => (
  <Icon>
    <path d="M10 17.5s5.5-5 5.5-9.3a5.5 5.5 0 0 0-11 0c0 4.3 5.5 9.3 5.5 9.3z" />
    <circle cx="10" cy="8.2" r="2" />
  </Icon>
);
const MoreIcon = () => (
  <Icon>
    <circle cx="5" cy="10" r="0.6" fill="currentColor" />
    <circle cx="10" cy="10" r="0.6" fill="currentColor" />
    <circle cx="15" cy="10" r="0.6" fill="currentColor" />
  </Icon>
);
const SentenceIcon = () => (
  <Icon>
    <path d="M3 10h14M6 7l-3 3 3 3M14 7l3 3-3 3" />
  </Icon>
);

/* ---------- Pieces ---------- */

function MenuButton({
  onClick,
  label,
  active,
  index,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  index: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`menu-item inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] transition-colors duration-150 ${
        active ? "bg-white/15 text-caramel" : "text-on-ink/80 hover:bg-white/10 hover:text-on-ink"
      }`}
      style={{ animationDelay: `${40 + index * 28}ms` }}
    >
      {children}
    </button>
  );
}

function Divider({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="menu-item mx-0.5 h-5 w-px bg-white/15"
      style={{ animationDelay: `${40 + index * 28}ms` }}
    />
  );
}

function FormShell({
  eyebrow,
  quote,
  children,
}: {
  eyebrow: string;
  quote: string;
  children: ReactNode;
}) {
  return (
    <div className="menu-panel w-[21rem] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-caramel">{eyebrow}</p>
      <p className="mt-1 truncate font-display text-[15px] italic text-on-ink/70">“{quote}”</p>
      {children}
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-on-ink outline-none transition-colors placeholder:text-on-ink/35 focus:border-caramel/80 focus:bg-white/[0.09]";

/* ---------- Menu ---------- */

// The toolbar that rises from a selection (or wherever the writer
// right-clicks): format it, pin a private note to it, or keep it as a
// character or place of this writing.
export default function SelectionMenu({
  editor,
  names,
  onAddName,
  ref,
}: {
  editor: Editor;
  names: NameEntry[];
  onAddName?: (name: string, kind: EntityKind, description?: string) => Promise<void>;
  ref?: Ref<SelectionMenuHandle>;
}) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [noteText, setNoteText] = useState("");
  const [nameText, setNameText] = useState("");
  const [detailText, setDetailText] = useState("");
  const [nameKind, setNameKind] = useState<EntityKind>("character");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<MenuState | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      heading: e.isActive("heading", { level: 2 }),
      quote: e.isActive("blockquote"),
    }),
  });

  function anchorFor(range: Range): Anchor {
    const start = editor.view.coordsAtPos(range.from);
    const end = editor.view.coordsAtPos(range.to);
    const oneLine = Math.abs(start.top - end.top) < 4;
    return {
      x: oneLine ? (start.left + end.left) / 2 : start.left + 40,
      y: start.top,
      placement: "above",
    };
  }

  function show(next: MenuState | null) {
    window.clearTimeout(closeTimer.current);
    menuRef.current = next;
    setMenu(next);
    setError(null);
    const holding = next && next.mode !== "actions" ? next.range : null;
    editor.commands.holdSelection(holding);
  }

  function close() {
    if (!menuRef.current) return;
    show(null);
  }

  function noteRangeAround(pos: number): Range | null {
    const type = editor.schema.marks.authorNote;
    const range = getMarkRange(editor.state.doc.resolve(pos), type);
    return range ?? null;
  }

  function existingNote(range: Range) {
    const mark = editor.state.doc
      .resolve(range.from + 1 <= range.to ? range.from + 1 : range.from)
      .marks()
      .find((m) => m.type.name === "authorNote");
    return mark ? String(mark.attrs.note ?? "") : "";
  }

  function textOf(range: Range) {
    return editor.state.doc.textBetween(range.from, range.to, " ");
  }

  function enter(mode: Mode, current: MenuState, kind?: EntityKind) {
    if (mode === "note") setNoteText(existingNote(current.range));
    if (mode === "name") {
      setNameText(cleanName(textOf(current.range)));
      setDetailText("");
      setNameKind(kind ?? "character");
    }
    show({ ...current, mode });
  }

  function finish(message: string) {
    if (!menuRef.current) return;
    show({ ...menuRef.current, mode: "done", message });
    closeTimer.current = window.setTimeout(() => show(null), 1100);
  }

  useImperativeHandle(ref, () => ({
    openNote: () => {
      const { from, to, empty } = editor.state.selection;
      const range = empty ? noteRangeAround(from) : { from, to };
      if (!range) return;
      enter("note", { mode: "actions", range, anchor: anchorFor(range), autoWord: false });
    },
  }));

  // Open from the editor: on right-click, after a mouse selection, after a
  // keyboard (Shift+arrow) selection.
  useEffect(() => {
    const dom = editor.view.dom as HTMLElement;

    function onContextMenu(event: MouseEvent) {
      if (event.shiftKey) return; // Shift+right-click keeps the browser's own menu.
      const hit = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
      if (!hit) return;
      event.preventDefault();
      const { selection } = editor.state;
      let range: Range | null = null;
      let autoWord = false;
      if (!selection.empty && hit.pos >= selection.from && hit.pos <= selection.to) {
        range = { from: selection.from, to: selection.to };
      } else {
        range = noteRangeAround(hit.pos) ?? wordRangeAt(editor.state.doc, hit.pos);
        autoWord = range !== null;
        if (range) editor.chain().focus().setTextSelection(range).run();
      }
      if (!range) return close();
      show({
        mode: "actions",
        range,
        autoWord,
        anchor: { x: event.clientX, y: event.clientY, placement: "pointer" },
      });
    }

    function openFromSelection() {
      const { from, to, empty } = editor.state.selection;
      if (empty || textOf({ from, to }).trim().length === 0) return;
      show({ mode: "actions", range: { from, to }, autoWord: false, anchor: anchorFor({ from, to }) });
    }

    function onPointerUp(event: PointerEvent) {
      if (event.button !== 0) return;
      requestAnimationFrame(openFromSelection);
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.shiftKey && event.key.startsWith("Arrow")) openFromSelection();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (menuRef.current?.mode === "actions" && !event.shiftKey) close();
    }

    dom.addEventListener("contextmenu", onContextMenu);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("keyup", onKeyUp);
    dom.addEventListener("keydown", onKeyDown);
    return () => {
      dom.removeEventListener("contextmenu", onContextMenu);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("keyup", onKeyUp);
      dom.removeEventListener("keydown", onKeyDown);
    };
    // The handlers read the latest menu through menuRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Close on a click elsewhere, Escape, or when the page scrolls away.
  useEffect(() => {
    if (!menu) return;
    function onPointerDown(event: PointerEvent) {
      if (boxRef.current?.contains(event.target as Node)) return;
      close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      const current = menuRef.current;
      if (current && (current.mode === "note" || current.mode === "name")) {
        show({ ...current, mode: "actions" });
        editor.commands.focus();
      } else {
        close();
        editor.commands.focus();
      }
    }
    function onScroll() {
      const current = menuRef.current;
      if (!current) return;
      if (current.mode === "actions") close();
      else show({ ...current, anchor: anchorFor(current.range) });
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu === null]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Keep the toolbar on screen; flip below the selection if there's no room
  // above it.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || !menu) return;
    box.style.marginLeft = "0px";
    box.style.marginTop = "0px";
    const rect = box.getBoundingClientRect();
    const pad = 12;
    let dx = 0;
    let dy = 0;
    if (rect.left < pad) dx = pad - rect.left;
    else if (rect.right > window.innerWidth - pad) dx = window.innerWidth - pad - rect.right;
    if (rect.top < pad) dy = menu.anchor.placement === "above" ? rect.height + 44 : pad - rect.top;
    else if (rect.bottom > window.innerHeight - pad) dy = window.innerHeight - pad - rect.bottom;
    box.style.marginLeft = `${dx}px`;
    box.style.marginTop = `${dy}px`;
  }, [menu]);

  if (!menu) return null;

  const text = textOf(menu.range);
  const asName = cleanName(text);
  const known = names.find(
    (n) =>
      lower(n.name) === lower(asName) ||
      (n.kind === "character" && lower(n.name.split(" ")[0]) === lower(asName)),
  );
  const inNote = existingNote(menu.range).length > 0;
  // A name is a few words, not a sentence.
  const looksLikeName =
    asName.length >= 2 &&
    asName.length <= 40 &&
    asName.split(" ").length <= 4 &&
    !/[,;:.!?…]/u.test(text.trim().replace(/[,;:.!?…'’]+\S*$/u, ""));
  const canName = Boolean(onAddName) && looksLikeName && !known;

  function format(kind: "bold" | "italic" | "heading" | "quote") {
    const chain = editor.chain().focus().setTextSelection(menu!.range);
    if (kind === "bold") chain.toggleBold().run();
    else if (kind === "italic") chain.toggleItalic().run();
    else if (kind === "heading") chain.toggleHeading({ level: 2 }).run();
    else chain.toggleBlockquote().run();
    // Block changes move text around; re-anchor to where it is now.
    if (kind === "heading" || kind === "quote") {
      const { from, to } = editor.state.selection;
      show({ ...menu!, range: { from, to }, anchor: anchorFor({ from, to }) });
    }
  }

  function selectSentence() {
    const range = sentenceRangeAt(editor.state.doc, menu!.range.from, menu!.range.to);
    if (!range) return;
    editor.chain().focus().setTextSelection(range).run();
    show({ ...menu!, range, autoWord: false });
  }

  function saveNote() {
    const note = noteText.trim();
    if (!note) return;
    editor
      .chain()
      .focus()
      .setTextSelection(menu!.range)
      .extendMarkRange("authorNote")
      .setMark("authorNote", { note })
      .run();
    finish(inNote ? "Not güncellendi" : "Not eklendi");
  }

  function removeNote() {
    editor.chain().focus().setTextSelection(menu!.range).extendMarkRange("authorNote").unsetMark("authorNote").run();
    finish("Not kaldırıldı");
  }

  async function saveName(kind: EntityKind) {
    const name = nameText.trim();
    if (!onAddName || name.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      await onAddName(name, kind, detailText.trim() || undefined);
      finish(`${name} ${ENTITY_KINDS[kind].label.toLocaleLowerCase("tr-TR")} olarak kaydedildi`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const match = /Uncaught Error: ([^\n]+)/u.exec(message);
      setError(match ? match[1] : "Kaydedilemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  const above = menu.anchor.placement === "above";
  let i = 0;

  return createPortal(
    <div
      ref={boxRef}
      className="fixed z-[60]"
      style={{
        left: above ? menu.anchor.x : menu.anchor.x + 4,
        top: above ? menu.anchor.y - 10 : menu.anchor.y + 6,
        transform: above ? "translate(-50%, -100%)" : undefined,
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div
        key={menu.mode === "actions" ? `a-${menu.range.from}-${menu.range.to}` : menu.mode}
        role={menu.mode === "actions" ? "toolbar" : "dialog"}
        aria-label="Seçim araçları"
        className="menu-pop relative rounded-xl bg-ink text-on-ink shadow-[0_22px_50px_-14px_rgba(15,25,57,0.6),0_0_0_1px_rgba(255,255,255,0.07)]"
        style={{ transformOrigin: above ? "50% 100%" : "0 0" }}
      >
        {menu.mode === "actions" && (
          <div className="flex items-center gap-0.5 p-1">
            <MenuButton index={i++} label="Kalın" active={active.bold} onClick={() => format("bold")}>
              <span className="w-3 text-center font-bold">K</span>
            </MenuButton>
            <MenuButton index={i++} label="İtalik" active={active.italic} onClick={() => format("italic")}>
              <span className="w-3 text-center italic">İ</span>
            </MenuButton>
            <MenuButton index={i++} label="Ara başlık" active={active.heading} onClick={() => format("heading")}>
              <span className="font-display text-[15px] leading-none">Başlık</span>
            </MenuButton>
            <MenuButton index={i++} label="Alıntı" active={active.quote} onClick={() => format("quote")}>
              <span className="font-display text-lg leading-none">“</span>
            </MenuButton>
            <Divider index={i++} />
            <MenuButton index={i++} label={inNote ? "Notu düzenle" : "Not ekle"} active={inNote} onClick={() => enter("note", menu)}>
              <NoteIcon />
              {inNote ? "Notu düzenle" : "Not"}
            </MenuButton>
            {known ? (
              <span
                className="menu-item ml-0.5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 text-[13px] text-on-ink/80"
                style={{ animationDelay: `${40 + i++ * 28}ms` }}
                title={known.detail}
              >
                <span className={`h-1.5 w-1.5 rotate-45 ${markStyleOf(known.kind) === "character" ? "bg-caramel" : "bg-sapphire"}`} />
                {known.name}
                <span className="text-on-ink/45">· {ENTITY_KINDS[known.kind].label.toLocaleLowerCase("tr-TR")}</span>
              </span>
            ) : (
              canName && (
                <>
                  <MenuButton index={i++} label="Karakter olarak kaydet" onClick={() => enter("name", menu, "character")}>
                    <PersonIcon />
                    Karakter
                  </MenuButton>
                  <MenuButton index={i++} label="Mekan olarak kaydet" onClick={() => enter("name", menu, "place")}>
                    <PlaceIcon />
                    Mekan
                  </MenuButton>
                  <MenuButton index={i++} label="Ülke, ırk, silah… olarak kaydet" onClick={() => enter("name", menu, "country")}>
                    <MoreIcon />
                  </MenuButton>
                </>
              )
            )}
            {menu.autoWord && (
              <>
                <Divider index={i++} />
                <MenuButton index={i++} label="Tüm cümleyi seç" onClick={selectSentence}>
                  <SentenceIcon />
                  Cümle
                </MenuButton>
              </>
            )}
          </div>
        )}

        {menu.mode === "note" && (
          <FormShell eyebrow={inNote ? "Notu düzenle · yalnızca sen" : "Not ekle · yalnızca sen"} quote={excerpt(text)}>
            <form
              className="mt-2.5"
              onSubmit={(event) => {
                event.preventDefault();
                saveNote();
              }}
            >
              <textarea
                autoFocus
                rows={3}
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    saveNote();
                  }
                }}
                placeholder="Kendine bir not… ör. 7. bölümde geri dönülecek"
                className={`${fieldClass} resize-none leading-snug`}
              />
              <div className="mt-2.5 flex items-center gap-2">
                <span className="mr-auto text-[11px] text-on-ink/45">↵ kaydet · Esc geri</span>
                {inNote && (
                  <button type="button" onClick={removeNote} className="rounded-lg px-2.5 py-1.5 text-[13px] text-on-ink/70 hover:bg-white/10 hover:text-on-ink">
                    Kaldır
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="rounded-lg bg-caramel px-3.5 py-1.5 text-[13px] font-semibold text-[#0f1939] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </FormShell>
        )}

        {menu.mode === "name" && (
          <FormShell eyebrow={`Yeni ${ENTITY_KINDS[nameKind].label.toLocaleLowerCase("tr-TR")}`} quote={excerpt(text)}>
            <div role="radiogroup" aria-label="Türü" className="mt-2.5 flex flex-wrap gap-1">
              {ENTITY_KIND_ORDER.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={kind === nameKind}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setNameKind(kind)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] transition-colors duration-150 ${
                    kind === nameKind
                      ? "bg-caramel text-[#0f1939] font-semibold"
                      : "bg-white/[0.06] text-on-ink/70 hover:bg-white/[0.12] hover:text-on-ink"
                  }`}
                >
                  <span aria-hidden="true" className="text-[10px] leading-none">{ENTITY_KINDS[kind].glyph}</span>
                  {ENTITY_KINDS[kind].label}
                </button>
              ))}
            </div>
            <form
              className="mt-2.5 flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void saveName(nameKind);
              }}
            >
              <input
                autoFocus
                value={nameText}
                onChange={(event) => setNameText(event.target.value)}
                aria-label="Ad"
                placeholder="Ad"
                className={`${fieldClass} font-medium`}
              />
              <input
                value={detailText}
                onChange={(event) => setDetailText(event.target.value)}
                aria-label="Kısa açıklama"
                placeholder={`${ENTITY_KINDS[nameKind].summaryPlaceholder} (isteğe bağlı)`}
                className={fieldClass}
              />
              {error && <p className="text-[12px] text-red-300">{error}</p>}
              <div className="mt-0.5 flex items-center gap-2">
                <span className="mr-auto text-[11px] text-on-ink/45">Ayrıntılar sonra Evren’de</span>
                <button
                  type="submit"
                  disabled={busy || nameText.trim().length < 2}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-caramel px-3.5 py-1.5 text-[13px] font-semibold text-[#0f1939] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {busy && <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#0f1939]/30 border-t-[#0f1939]" />}
                  Kaydet
                </button>
              </div>
            </form>
          </FormShell>
        )}

        {menu.mode === "done" && (
          <div className="menu-panel flex items-center gap-2.5 px-3.5 py-2.5 text-[13px]">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 shrink-0 text-caramel">
              <circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
              <path d="M6.2 10.4l2.5 2.5 5.1-5.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="menu-check" />
            </svg>
            <span role="status">{menu.message}</span>
          </div>
        )}

        {above && menu.mode === "actions" && (
          <span aria-hidden="true" className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-ink" />
        )}
      </div>
    </div>,
    document.body,
  );
}

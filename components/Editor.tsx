"use client";

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Focus, Placeholder } from "@tiptap/extensions";
import { keyKind, playKey, preloadSound } from "@/lib/typingSounds";
import { loadWords, type Lang } from "@/lib/completion";
import { SpellCheck } from "@/lib/spellExtension";
import SpellMenu from "@/components/SpellMenu";
import type { WritingModes } from "@/lib/writingModes";
import { useEffect, useEffectEvent, useImperativeHandle, useRef, type Ref, type RefObject } from "react";
import type { EditorView } from "@tiptap/pm/view";
import { MM, type Paper } from "@/lib/paper";
import SelectionMenu, { type SelectionMenuHandle } from "@/components/SelectionMenu";
import type { EntityKind } from "@/convex/entityKinds";
import {
  AuthorNote,
  AuthorNoteHidden,
  collectNotes,
  HeldSelection,
  Pagination,
  ReadingAids,
  WordCompletion,
  type NameEntry,
  type NoteEntry,
  type PageBreak,
} from "@/lib/editorExtensions";

function parseContent(content: string): JSONContent | string {
  if (content.trim().length === 0) return "";
  try {
    return JSON.parse(content) as JSONContent;
  } catch {
    return content;
  }
}

export function countWords(text: string): number {
  const words = text.trim().split(/\s+/u);
  return words[0] === "" ? 0 : words.length;
}

const prose =
  "leading-7 text-foreground [&_p]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:border-caramel [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted";

// The writing surface: book-sized type with room to breathe, as on Medium or
// in a Pages document — no box around the text.
const writingProse =
  "writing-surface text-foreground text-[1.16rem] leading-[1.9] sm:text-[1.2rem] [&_.ProseMirror]:min-h-[55vh] [&_.ProseMirror]:outline-none [&_p]:mb-[1.1em] [&_h2]:mt-[1.6em] [&_h2]:mb-[0.5em] [&_h2]:font-display [&_h2]:text-[1.65em] [&_h2]:leading-tight [&_h2]:font-medium [&_ul]:list-disc [&_ul]:pl-7 [&_ul]:mb-[1.1em] [&_ol]:list-decimal [&_ol]:pl-7 [&_ol]:mb-[1.1em] [&_li_p]:mb-[0.3em] [&_blockquote]:my-[1.4em] [&_blockquote]:border-l-[3px] [&_blockquote]:border-caramel [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-[1.15em] [&_blockquote]:italic [&_blockquote]:text-muted";

/* ---------- Page view ---------- */

export type PageView = {
  paper: Paper;
  // The sheet's content box, inside the margins: page 1 starts at its top.
  content: RefObject<HTMLElement | null>;
  // The sheet is drawn smaller than life when it doesn't fit the screen.
  scale: number;
  onLayout: (layout: { pages: number; lastBlank: number }) => void;
};

export const SHEET_GAP = 28;

// The start of the visual line a position is on.
function lineStart(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos);
  if (!$pos.parent.isTextblock) return pos;
  const blockStart = $pos.start();
  const top = view.coordsAtPos(pos, 1).top;
  let p = pos;
  for (let i = 0; i < 2000 && p > blockStart; i++) {
    if (Math.abs(view.coordsAtPos(p - 1, 1).top - top) > 2) break;
    p -= 1;
  }
  return p;
}

// The first line, at or below the page boundary, that doesn't end on the
// page: the next page starts with it.
function firstLineOver(
  view: EditorView,
  left: number,
  top: number,
  scale: number,
  boundary: number,
  end: number,
) {
  let probe = boundary - 1;
  for (let i = 0; i < 600 && probe < end + 2; i++) {
    const hit = view.posAtCoords({ left, top: top + probe * scale });
    if (!hit) {
      probe += 3;
      continue;
    }
    const pos = lineStart(view, hit.pos);
    const coords = view.coordsAtPos(pos, 1);
    const lineTop = (coords.top - top) / scale;
    const lineBottom = (coords.bottom - top) / scale;
    if (lineBottom > boundary + 0.5 && lineBottom > probe - 1) return { pos, lineTop };
    probe = Math.max(probe + 2, lineBottom + 1);
  }
  return null;
}

// Lays the text out on sheets of the chosen paper: measures where each page
// fills up and puts a break (the rest of the page, the gap, the next page's
// top margin) before the first line that doesn't fit.
function usePagination(editor: Editor | null, view: PageView | undefined) {
  const report = useEffectEvent((layout: { pages: number; lastBlank: number }) => view?.onLayout(layout));
  const paper = view?.paper;
  const scale = view?.scale ?? 1;
  const content = view?.content;

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (!paper || !content) {
      editor.commands.setPageBreaks([], null);
      return;
    }
    const pageHeight = (paper.height - paper.marginTop - paper.marginBottom) * MM;
    const geometry = {
      marginTop: paper.marginTop * MM,
      marginBottom: paper.marginBottom * MM,
      marginX: paper.marginX * MM,
      gap: SHEET_GAP,
    };
    let frame = 0;
    let last = "";

    const measure = () => {
      frame = 0;
      const box = content.current;
      if (!box || editor.isDestroyed) return;
      const pm = editor.view;
      const root = pm.dom as HTMLElement;
      const scrollY = window.scrollY;
      root.classList.add("pagination-measuring");
      const top = box.getBoundingClientRect().top;
      const left = root.getBoundingClientRect().left + 2;
      const lastBlock = root.lastElementChild as HTMLElement | null;
      const end = lastBlock ? (lastBlock.getBoundingClientRect().bottom - top) / scale : 0;
      const breaks: PageBreak[] = [];
      let start = 0;
      let page = 1;
      while (start + pageHeight < end - 0.5 && page < 2000) {
        const boundary = start + pageHeight;
        const found = firstLineOver(pm, left, top, scale, boundary, end);
        if (!found) break;
        if (found.lineTop <= start + 0.5) {
          // One line taller than a page: let it run over rather than loop.
          start = boundary;
          continue;
        }
        // Negative when a paragraph gap already runs past the boundary: the
        // bottom margin shrinks by that much so the page keeps its size.
        breaks.push({ pos: found.pos, blank: boundary - found.lineTop, page });
        start = found.lineTop;
        page += 1;
      }
      root.classList.remove("pagination-measuring");
      if (window.scrollY !== scrollY) window.scrollTo(window.scrollX, scrollY);
      const key = JSON.stringify(breaks);
      if (key !== last) {
        last = key;
        editor.commands.setPageBreaks(breaks, geometry);
      }
      report({ pages: page, lastBlank: Math.max(0, start + pageHeight - end) });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    editor.on("update", schedule);
    const observer = new ResizeObserver(schedule);
    if (content.current) observer.observe(content.current);
    void document.fonts?.ready.then(schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      editor.off("update", schedule);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      if (!editor.isDestroyed) editor.commands.setPageBreaks([], null);
    };
  }, [editor, paper, scale, content]);
}

/* ---------- Writing modes ---------- */

// Typewriter: after every keystroke or caret move, the page scrolls so the
// line being written sits at the same height on the screen.
function useTypewriter(editor: Editor | null, on: boolean) {
  useEffect(() => {
    if (!editor || !on) return;
    let frame = 0;
    const center = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (editor.isDestroyed || !editor.isFocused) return;
        const caret = editor.view.coordsAtPos(editor.state.selection.head);
        const target = window.innerHeight * 0.42;
        const delta = caret.top - target;
        if (Math.abs(delta) > 2) window.scrollBy({ top: delta, behavior: "smooth" });
      });
    };
    editor.on("selectionUpdate", center);
    editor.on("update", center);
    editor.on("focus", center);
    center();
    return () => {
      cancelAnimationFrame(frame);
      editor.off("selectionUpdate", center);
      editor.off("update", center);
      editor.off("focus", center);
    };
  }, [editor, on]);
}

function useTypingSounds(editor: Editor | null, sound: WritingModes["sound"], volume: number) {
  useEffect(() => {
    if (!editor || sound === "none") return;
    preloadSound(sound);
    const dom = editor.view.dom as HTMLElement;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const kind = keyKind(event);
      if (kind) playKey(sound, kind, volume);
    };
    dom.addEventListener("keydown", onKey);
    return () => dom.removeEventListener("keydown", onKey);
  }, [editor, sound, volume]);
}

// Word completion in the writing's language. Off on touch screens, where
// the phone's keyboard already suggests words.
function useCompletion(editor: Editor | null, lang: Lang | undefined, on: boolean, names: NameEntry[]) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (lang) editor.view.dom.setAttribute("lang", lang);
    const enabled = on && !!lang && !window.matchMedia("(pointer: coarse)").matches;
    const apply = () => {
      if (editor.isDestroyed) return;
      editor.commands.setCompletion({ enabled, lang: lang ?? null, names: names.map((n) => n.name) });
    };
    apply();
    let live = true;
    if (enabled && lang) void loadWords(lang).then(() => live && apply());
    return () => {
      live = false;
    };
  }, [editor, lang, on, names]);
}

// Spell checking in the writing's language, in a worker. The browser's own
// checker is turned off while ours runs, so words aren't underlined twice.
function useSpellCheck(editor: Editor | null, lang: Lang | undefined, on: boolean, names: NameEntry[]) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const enabled = on && !!lang && !window.matchMedia("(pointer: coarse)").matches;
    editor.view.dom.setAttribute("spellcheck", enabled ? "false" : "true");
    editor.commands.setSpellCheck({ enabled, lang: lang ?? null, names: names.map((n) => n.name) });
  }, [editor, lang, on, names]);
}

// Keeps name highlighting and bionic reading in step with props.
function useReadingAids(editor: Editor | null, names: NameEntry[], bionic: boolean) {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.commands.setReadingAids({ names, bionic });
  }, [editor, names, bionic]);
}

export function ChapterReader({
  content,
  names = EMPTY_NAMES,
  bionic = false,
}: {
  content: string;
  names?: NameEntry[];
  bionic?: boolean;
}) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    extensions: [StarterKit, AuthorNoteHidden, ReadingAids],
    content: parseContent(content),
  });
  useReadingAids(editor, names, bionic);
  return <EditorContent editor={editor} className={`${prose} reading-surface`} />;
}

const EMPTY_NAMES: NameEntry[] = [];

type AddableKind = EntityKind;

export type ChapterEditorHandle = {
  focusStart: () => void;
  goTo: (pos: number) => void;
  // The text before and after the cursor, for splitting a chapter there.
  splitAtCursor: () => { head: string; tail: string } | null;
};

export function ChapterEditor({
  content,
  onChange,
  onWordCount,
  onNotesChange,
  names = EMPTY_NAMES,
  onAddName,
  placeholder = "Yazmaya başla…",
  pageView,
  modes,
  lang,
  ref,
}: {
  content: string;
  onChange: (json: string) => void;
  onWordCount?: (words: number) => void;
  onNotesChange?: (notes: NoteEntry[]) => void;
  names?: NameEntry[];
  onAddName?: (name: string, kind: AddableKind, description?: string) => Promise<void>;
  placeholder?: string;
  pageView?: PageView;
  modes?: WritingModes;
  lang?: Lang;
  ref?: Ref<ChapterEditorHandle>;
}) {
  const menuRef = useRef<SelectionMenuHandle>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      AuthorNote,
      ReadingAids,
      HeldSelection,
      Pagination,
      WordCompletion,
      SpellCheck,
      Focus.configure({ className: "has-focus", mode: "shallowest" }),
      Placeholder.configure({ placeholder }),
    ],
    content: parseContent(content),
    onCreate: ({ editor }) => onWordCount?.(countWords(editor.getText({ blockSeparator: "\n" }))),
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
      onWordCount?.(countWords(editor.getText({ blockSeparator: "\n" })));
    },
  });
  useReadingAids(editor, names, false);
  usePagination(editor, pageView);
  useTypewriter(editor, modes?.typewriter ?? false);
  useTypingSounds(editor, modes?.sound ?? "none", modes?.volume ?? 0);
  useCompletion(editor, lang, modes?.complete ?? false, names);
  useSpellCheck(editor, lang, modes?.spell ?? false, names);

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  const notes = useEditorState({
    editor,
    selector: ({ editor: e }) => (e ? collectNotes(e.state.doc) : []),
    equalityFn: (a, b) =>
      a === b ||
      (!!a &&
        !!b &&
        a.length === b.length &&
        a.every((n, i) => n.from === b[i].from && n.note === b[i].note && n.excerpt === b[i].excerpt)),
  });

  useEffect(() => {
    onNotesChange?.(notes ?? []);
  }, [notes, onNotesChange]);

  useImperativeHandle(ref, () => ({
    focusStart: () => editor?.chain().focus("start").run(),
    goTo: (pos: number) =>
      editor?.chain().focus().setTextSelection(pos).scrollIntoView().run(),
    splitAtCursor: () => {
      if (!editor) return null;
      const { doc, selection } = editor.state;
      const pos = selection.from;
      return {
        head: JSON.stringify(doc.cut(0, pos).toJSON()),
        tail: JSON.stringify(doc.cut(pos).toJSON()),
      };
    },
  }));

  if (!editor) {
    return <div className="min-h-[55vh]" />;
  }

  return (
    <>
      <EditorContent editor={editor} className={`${writingProse} ${modes?.focus ? "focus-mode" : ""}`} />
      <SelectionMenu ref={menuRef} editor={editor} names={names} onAddName={onAddName} />
      {lang && modes?.spell && <SpellMenu editor={editor} lang={lang} />}
    </>
  );
}

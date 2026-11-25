"use client";

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, type ReactNode } from "react";
import {
  AuthorNote,
  AuthorNoteHidden,
  collectNotes,
  ReadingAids,
  type NameEntry,
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

function ToolButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`min-w-8 rounded-sm px-2 py-1 text-sm transition-colors disabled:opacity-35 ${
        active
          ? "bg-accent-soft text-accent"
          : "text-foreground hover:bg-accent-soft/60"
      }`}
    >
      {children}
    </button>
  );
}

type AddableKind = "character" | "place";

export function ChapterEditor({
  content,
  onChange,
  onWordCount,
  names = EMPTY_NAMES,
  onAddName,
}: {
  content: string;
  onChange: (json: string) => void;
  onWordCount?: (words: number) => void;
  names?: NameEntry[];
  onAddName?: (name: string, kind: AddableKind) => Promise<void>;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, AuthorNote, ReadingAids],
    content: parseContent(content),
    onCreate: ({ editor }) => onWordCount?.(countWords(editor.getText({ blockSeparator: "\n" }))),
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
      onWordCount?.(countWords(editor.getText({ blockSeparator: "\n" })));
    },
  });
  useReadingAids(editor, names, false);

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            heading: e.isActive("heading", { level: 2 }),
            quote: e.isActive("blockquote"),
            list: e.isActive("bulletList"),
            inNote: e.isActive("authorNote"),
            noteText: String(e.getAttributes("authorNote").note ?? ""),
            selected: e.state.doc
              .textBetween(e.state.selection.from, e.state.selection.to, " ")
              .trim(),
            notes: collectNotes(e.state.doc),
          }
        : null,
  });

  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [adding, setAdding] = useState<AddableKind | null>(null);

  if (!editor || !state) {
    return <div className="min-h-[300px] rounded border border-border" />;
  }

  const chain = () => editor.chain().focus();
  const canNote = state.inNote || state.selected.length > 0;
  const selectedName = state.selected.length > 0 && state.selected.length <= 60 ? state.selected : "";
  const alreadyNamed = names.some(
    (n) => n.name.toLocaleLowerCase("tr-TR") === selectedName.toLocaleLowerCase("tr-TR"),
  );

  function openNote() {
    setNoteDraft(state?.inNote ? state.noteText : "");
  }

  function saveNote() {
    const text = (noteDraft ?? "").trim();
    if (text.length === 0) return;
    chain().extendMarkRange("authorNote").setMark("authorNote", { note: text }).run();
    setNoteDraft(null);
  }

  function removeNote() {
    chain().extendMarkRange("authorNote").unsetMark("authorNote").run();
    setNoteDraft(null);
  }

  async function addName(kind: AddableKind) {
    if (!onAddName || !selectedName) return;
    setAdding(kind);
    try {
      await onAddName(selectedName, kind);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded border border-border">
        <div
          role="toolbar"
          aria-label="Biçimlendirme"
          className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-surface/95 px-1.5 py-1 backdrop-blur"
        >
          <ToolButton label="Kalın (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}>
            <span className="font-bold">K</span>
          </ToolButton>
          <ToolButton label="İtalik (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}>
            <span className="italic">İ</span>
          </ToolButton>
          <ToolButton
            label="Ara başlık"
            active={state.heading}
            onClick={() => chain().toggleHeading({ level: 2 }).run()}
          >
            <span className="font-display">Başlık</span>
          </ToolButton>
          <ToolButton label="Alıntı" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
            “ ”
          </ToolButton>
          <ToolButton label="Liste" active={state.list} onClick={() => chain().toggleBulletList().run()}>
            • Liste
          </ToolButton>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          <ToolButton
            label={state.inNote ? "Notu düzenle" : "Seçili metne not ekle"}
            active={state.inNote || noteDraft !== null}
            disabled={!canNote}
            onClick={openNote}
          >
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[2px] bg-caramel/70" />
              {state.inNote ? "Notu düzenle" : "Not"}
            </span>
          </ToolButton>
          {onAddName && (
            <>
              <ToolButton
                label="Seçili adı karakter olarak ekle"
                disabled={!selectedName || alreadyNamed || adding !== null}
                onClick={() => void addName("character")}
              >
                {adding === "character" ? "Ekleniyor…" : "+ Karakter"}
              </ToolButton>
              <ToolButton
                label="Seçili adı mekan olarak ekle"
                disabled={!selectedName || alreadyNamed || adding !== null}
                onClick={() => void addName("place")}
              >
                {adding === "place" ? "Ekleniyor…" : "+ Mekan"}
              </ToolButton>
            </>
          )}
        </div>

        {noteDraft !== null && (
          <div className="flex flex-col gap-2 border-b border-border bg-caramel-soft/60 p-3">
            <label htmlFor="author-note" className="text-xs font-medium text-muted">
              {state.inNote ? "Not" : `“${state.selected.slice(0, 48)}${state.selected.length > 48 ? "…" : ""}” için not`}
              <span className="font-normal"> — yalnızca sen görürsün</span>
            </label>
            <textarea
              id="author-note"
              autoFocus
              rows={2}
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) saveNote();
                if (event.key === "Escape") setNoteDraft(null);
              }}
              placeholder="Örn. Burada babasıyla ilgili ipucu verilecek"
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                type="button"
                onClick={saveNote}
                disabled={noteDraft.trim().length === 0}
                className="rounded-sm bg-accent px-3 py-1 font-medium text-accent-contrast disabled:opacity-50"
              >
                Notu kaydet
              </button>
              {state.inNote && (
                <button type="button" onClick={removeNote} className="text-muted underline">
                  Notu kaldır
                </button>
              )}
              <button type="button" onClick={() => setNoteDraft(null)} className="text-muted underline">
                Vazgeç
              </button>
            </div>
          </div>
        )}

        <EditorContent
          editor={editor}
          className={`${prose} min-h-[300px] p-3 [&_.ProseMirror]:min-h-[276px] [&_.ProseMirror]:outline-none`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="name-legend name-character">Ad</span> karakter
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="name-legend name-place">Ad</span> mekan
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="author-note px-1">metin</span> notun
        </span>
        {names.length === 0 && (
          <span>
            Bir adı seçip “+ Karakter” ya da “+ Mekan”a basınca metinde vurgulanır.
          </span>
        )}
      </div>

      {state.notes.length > 0 && (
        <details className="rounded border border-border px-3 py-2 text-sm" open>
          <summary className="cursor-pointer select-none font-medium">
            Bu bölümdeki notların ({state.notes.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {state.notes.map((entry) => (
              <li key={entry.from}>
                <button
                  type="button"
                  onClick={() => {
                    chain().setTextSelection(entry.from + 1).scrollIntoView().run();
                  }}
                  className="w-full rounded px-2 py-1 text-left hover:bg-caramel-soft/60"
                >
                  <span className="author-note px-0.5">{entry.excerpt.slice(0, 60)}</span>
                  <span className="mt-0.5 block text-muted">{entry.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

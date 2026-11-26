"use client";

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import SelectionMenu, { type SelectionMenuHandle } from "@/components/SelectionMenu";
import type { EntityKind } from "@/convex/entityKinds";
import {
  AuthorNote,
  AuthorNoteHidden,
  collectNotes,
  HeldSelection,
  ReadingAids,
  type NameEntry,
  type NoteEntry,
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
};

export function ChapterEditor({
  content,
  onChange,
  onWordCount,
  onNotesChange,
  names = EMPTY_NAMES,
  onAddName,
  placeholder = "Yazmaya başla…",
  ref,
}: {
  content: string;
  onChange: (json: string) => void;
  onWordCount?: (words: number) => void;
  onNotesChange?: (notes: NoteEntry[]) => void;
  names?: NameEntry[];
  onAddName?: (name: string, kind: AddableKind, description?: string) => Promise<void>;
  placeholder?: string;
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
  }));

  if (!editor) {
    return <div className="min-h-[55vh]" />;
  }

  return (
    <>
      <EditorContent editor={editor} className={writingProse} />
      <SelectionMenu ref={menuRef} editor={editor} names={names} onAddName={onAddName} />
    </>
  );
}

import { Extension, Mark, mergeAttributes } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/* ---------- Author notes ---------- */

// A private margin note pinned to a stretch of text. Only the author ever
// receives it (the server strips it for everyone else).
export const AuthorNote = Mark.create({
  name: "authorNote",
  inclusive: false,
  addAttributes() {
    return {
      note: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-note") ?? "",
        renderHTML: (attributes) => ({
          "data-note": attributes.note,
          title: attributes.note,
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-note]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "author-note" }), 0];
  },
});

// In reading view the author previews their text as readers will see it.
export const AuthorNoteHidden = AuthorNote.extend({
  renderHTML() {
    return ["span", 0];
  },
});

export type NoteEntry = { note: string; excerpt: string; from: number };

export function collectNotes(doc: PMNode): NoteEntry[] {
  const notes: NoteEntry[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    const mark = node.marks.find((m) => m.type.name === "authorNote");
    if (!mark) return false;
    const last = notes[notes.length - 1];
    const note = String(mark.attrs.note ?? "");
    if (last && last.note === note && last.from + last.excerpt.length === pos) {
      last.excerpt += node.text ?? "";
    } else {
      notes.push({ note, excerpt: node.text ?? "", from: pos });
    }
    return false;
  });
  return notes;
}

/* ---------- Name highlighting + bionic reading ---------- */

export type NameEntry = {
  name: string;
  kind: "character" | "place";
  detail?: string;
};

export const readingAidsKey = new PluginKey<DecorationSet>("readingAids");

type Needle = { text: string; entry: NameEntry };

const WORD_CHAR = /[\p{L}\p{M}\p{N}]/u;
const WORD = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu;

function lower(text: string) {
  return text.toLocaleLowerCase("tr-TR");
}

// Full names, plus a character's first name on its own ("Selin" for
// "Selin Aras"), longest first so the full name wins.
function needlesFor(names: NameEntry[]): Needle[] {
  const seen = new Set<string>();
  const needles: Needle[] = [];
  const add = (text: string, entry: NameEntry) => {
    const key = lower(text.trim());
    if (key.length < 2 || seen.has(key)) return;
    seen.add(key);
    needles.push({ text: key, entry });
  };
  for (const entry of names) add(entry.name, entry);
  for (const entry of names) {
    const first = entry.name.trim().split(/\s+/u)[0];
    if (entry.kind === "character" && first && first.length >= 3 && first !== entry.name.trim()) {
      add(first, entry);
    }
  }
  return needles.sort((a, b) => b.text.length - a.text.length);
}

// The text of a textblock, one character per document position.
function blockText(node: PMNode) {
  let text = "";
  node.forEach((child) => {
    text += child.isText ? (child.text ?? "") : "￼".repeat(child.nodeSize);
  });
  return text;
}

export function bionicSplit(length: number) {
  return length <= 3 ? 1 : Math.ceil(length * 0.5);
}

function buildDecorations(doc: PMNode, names: NameEntry[], bionic: boolean) {
  const needles = needlesFor(names);
  const decorations: Decoration[] = [];
  if (needles.length === 0 && !bionic) return DecorationSet.empty;

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    const text = blockText(node);
    const start = pos + 1;

    if (needles.length > 0) {
      const folded = lower(text);
      const haystack = folded.length === text.length ? folded : text;
      const taken: [number, number][] = [];
      for (const needle of needles) {
        let index = haystack.indexOf(needle.text);
        while (index !== -1) {
          const end = index + needle.text.length;
          const before = haystack[index - 1];
          const after = haystack[end];
          // Turkish adds suffixes straight onto common nouns ("iskelenin",
          // "Limanlar"), so a name of four letters or more may run on into
          // its suffix; shorter ones ("Ada") must stand alone.
          const bounded =
            (before === undefined || !WORD_CHAR.test(before)) &&
            (needle.text.length >= 4 || after === undefined || !WORD_CHAR.test(after));
          const overlaps = taken.some(([a, b]) => index < b && end > a);
          if (bounded && !overlaps) {
            taken.push([index, end]);
            const { entry } = needle;
            decorations.push(
              Decoration.inline(start + index, start + end, {
                class: `name-mark name-${entry.kind}`,
                title: entry.detail ? `${entry.name} — ${entry.detail}` : entry.name,
              }),
            );
          }
          index = haystack.indexOf(needle.text, end);
        }
      }
    }

    if (bionic) {
      for (const match of text.matchAll(WORD)) {
        const from = start + (match.index ?? 0);
        decorations.push(
          Decoration.inline(from, from + bionicSplit(match[0].length), { class: "bionic" }),
        );
      }
    }
    return false;
  });

  return DecorationSet.create(doc, decorations);
}

export type ReadingAidsSettings = { names: NameEntry[]; bionic: boolean };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    readingAids: {
      setReadingAids: (settings: ReadingAidsSettings) => ReturnType;
    };
  }
  interface Storage {
    readingAids: ReadingAidsSettings;
  }
}

// Settings live in the editor's storage so a component can change them with
// `setReadingAids` without rebuilding the editor (which would lose the
// cursor and undo history).
export const ReadingAids = Extension.create({
  name: "readingAids",
  addStorage(): ReadingAidsSettings {
    return { names: [], bionic: false };
  },
  addCommands() {
    return {
      setReadingAids:
        (settings) =>
        ({ tr, dispatch }) => {
          this.storage.names = settings.names;
          this.storage.bionic = settings.bionic;
          if (dispatch) tr.setMeta(readingAidsKey, true);
          return true;
        },
    };
  },
  addProseMirrorPlugins() {
    const settings = () => this.storage as ReadingAidsSettings;
    return [
      new Plugin<DecorationSet>({
        key: readingAidsKey,
        state: {
          init: (_, { doc }) => buildDecorations(doc, settings().names, settings().bionic),
          apply: (tr, previous) =>
            tr.docChanged || tr.getMeta(readingAidsKey)
              ? buildDecorations(tr.doc, settings().names, settings().bionic)
              : previous.map(tr.mapping, tr.doc),
        },
        props: {
          decorations: (state) => readingAidsKey.getState(state),
        },
      }),
    ];
  },
});

/* ---------- Held selection ---------- */

// While the writer types a note or a name in the floating toolbar, focus
// leaves the editor and the browser stops painting the selection. This keeps
// the chosen text visibly marked until the toolbar closes.
export type HeldRange = { from: number; to: number } | null;

export const heldSelectionKey = new PluginKey<HeldRange>("heldSelection");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    heldSelection: {
      holdSelection: (range: HeldRange) => ReturnType;
    };
  }
}

export const HeldSelection = Extension.create({
  name: "heldSelection",
  addCommands() {
    return {
      holdSelection:
        (range) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(heldSelectionKey, { range });
          return true;
        },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin<HeldRange>({
        key: heldSelectionKey,
        state: {
          init: () => null,
          apply: (tr, previous) => {
            const meta = tr.getMeta(heldSelectionKey) as { range: HeldRange } | undefined;
            if (meta) return meta.range;
            if (!previous || !tr.docChanged) return previous;
            return {
              from: tr.mapping.map(previous.from),
              to: tr.mapping.map(previous.to),
            };
          },
        },
        props: {
          decorations: (state) => {
            const range = heldSelectionKey.getState(state);
            if (!range || range.from >= range.to) return DecorationSet.empty;
            return DecorationSet.create(state.doc, [
              Decoration.inline(range.from, range.to, { class: "held-selection" }),
            ]);
          },
        },
      }),
    ];
  },
});

// The word around a document position, for right-clicking without a
// selection.
export function wordRangeAt(doc: PMNode, pos: number): { from: number; to: number } | null {
  const $pos = doc.resolve(pos);
  const parent = $pos.parent;
  if (!parent.isTextblock) return null;
  const text = parent.textBetween(0, parent.content.size, "\n", "￼");
  let start = $pos.parentOffset;
  // Clicked on a space or comma: take the nearest word, left side first.
  const isWord = (i: number) => i >= 0 && i < text.length && WORD_CHAR.test(text[i]);
  if (!isWord(start) && !isWord(start - 1)) {
    if (isWord(start - 2)) start -= 2;
    else if (isWord(start + 1)) start += 1;
  }
  let end = start;
  while (start > 0 && WORD_CHAR.test(text[start - 1])) start--;
  while (end < text.length && WORD_CHAR.test(text[end])) end++;
  if (start === end) return null;
  const base = $pos.start();
  return { from: base + start, to: base + end };
}

// The sentence around a range: from the previous ., !, ? or … (or the start
// of the paragraph) to the next one.
export function sentenceRangeAt(
  doc: PMNode,
  from: number,
  to: number,
): { from: number; to: number } | null {
  const $from = doc.resolve(from);
  const parent = $from.parent;
  if (!parent.isTextblock || !$from.sameParent(doc.resolve(to))) return null;
  const text = parent.textBetween(0, parent.content.size, "\n", "￼");
  const base = $from.start();
  let start = from - base;
  let end = to - base;
  while (start > 0 && !/[.!?…\n]/u.test(text[start - 1])) start--;
  while (start < text.length && /\s/u.test(text[start])) start++;
  while (end < text.length && !/[.!?…\n]/u.test(text[end])) end++;
  while (end < text.length && /[.!?…"'»”’)]/u.test(text[end])) end++;
  return { from: base + start, to: base + end };
}

/* ---------- Plain text for the speed reader ---------- */

export type FlowWord = { text: string; paragraphEnd: boolean };

type JsonNode = { type?: string; text?: string; content?: JsonNode[] };

// Words in reading order, marking where each paragraph ends so the speed
// reader can pause there.
export function flowWords(content: string): FlowWord[] {
  const paragraphs: string[] = [];
  try {
    const walk = (node: JsonNode): string => {
      if (node.type === "text") return node.text ?? "";
      if (node.type === "hardBreak") return " ";
      const inner = (node.content ?? []).map(walk).join("");
      if (node.type === "paragraph" || node.type === "heading") {
        paragraphs.push(inner);
        return "";
      }
      return inner;
    };
    walk(JSON.parse(content) as JsonNode);
  } catch {
    const plain = content
      .replace(/<\/(p|h\d|li|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, " ");
    paragraphs.push(...plain.split("\n"));
  }
  const words: FlowWord[] = [];
  for (const paragraph of paragraphs) {
    const parts = paragraph.split(/\s+/u).filter(Boolean);
    parts.forEach((text, i) => words.push({ text, paragraphEnd: i === parts.length - 1 }));
  }
  return words;
}

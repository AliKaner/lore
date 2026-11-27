import { Extension } from "@tiptap/react";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { isCommonWord, loadWords, lowerIn, type Lang } from "@/lib/completion";
import { ownWords, spellChecker } from "@/lib/spellClient";

// Spell checking: words the dictionary doesn't know get a wavy line. A click
// on one opens suggestions (see SpellMenu). Skipped: the word being typed,
// names from the writer's world, the writer's own dictionary, words in
// capitals, words with digits.

export type SpellSettings = { enabled: boolean; lang: Lang | null; names: string[] };
export type SpellOpen = { from: number; to: number; word: string } | null;
type SpellState = { decorations: DecorationSet; open: SpellOpen };

type SpellStorage = SpellSettings & {
  // Per language: word → spelled right?
  known: Map<string, boolean>;
  ignored: Set<string>;
  nameSet: Set<string>;
  // Set by the plugin's view: check the document now.
  kick: (() => void) | null;
};

export const spellKey = new PluginKey<SpellState>("spellCheck");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    spellCheck: {
      setSpellCheck: (settings: SpellSettings) => ReturnType;
      openSpell: (open: SpellOpen) => ReturnType;
      ignoreSpelling: (word: string) => ReturnType;
      refreshSpelling: () => ReturnType;
    };
  }
  interface Storage {
    spellCheck: SpellStorage;
  }
}

const WORD = /\p{L}+(?:['’]\p{L}+)*/gu;
const normal = (word: string) => word.replace(/’/gu, "'");

function candidate(word: string, store: SpellStorage, lang: Lang) {
  if (word.length < 2) return false;
  if (word === word.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US")) return false;
  const lower = lowerIn(lang, word);
  const stem = lower.split("'")[0];
  if (store.nameSet.has(lower) || store.nameSet.has(stem)) return false;
  if (store.ignored.has(lower)) return false;
  if (isCommonWord(lang, lower)) return false;
  return true;
}

// Every word worth checking, with where it is.
function words(doc: PMNode, store: SpellStorage, lang: Lang) {
  const found: { from: number; to: number; word: string }[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    if (node.marks.some((m) => m.type.name === "code")) return;
    for (const match of node.text.matchAll(WORD)) {
      const word = normal(match[0]);
      if (!candidate(word, store, lang)) continue;
      found.push({ from: pos + match.index, to: pos + match.index + match[0].length, word });
    }
  });
  return found;
}

function build(state: EditorState, store: SpellStorage, typing: boolean): DecorationSet {
  if (!store.enabled || !store.lang) return DecorationSet.empty;
  const head = state.selection.head;
  const marks: Decoration[] = [];
  for (const w of words(state.doc, store, store.lang)) {
    if (store.known.get(w.word) !== false) continue;
    // Not the word still being written.
    if (typing && head >= w.from && head <= w.to) continue;
    marks.push(Decoration.inline(w.from, w.to, { class: "spell-error" }, { word: w.word }));
  }
  return DecorationSet.create(state.doc, marks);
}

export const SpellCheck = Extension.create({
  name: "spellCheck",
  addStorage(): SpellStorage {
    return { enabled: false, lang: null, names: [], known: new Map(), ignored: new Set(), nameSet: new Set(), kick: null };
  },
  addCommands() {
    return {
      setSpellCheck:
        (settings) =>
        ({ tr, dispatch }) => {
          const store = this.storage as SpellStorage;
          if (store.lang !== settings.lang) store.known = new Map();
          store.enabled = settings.enabled;
          store.lang = settings.lang;
          store.names = settings.names;
          const lang = settings.lang ?? "tr";
          store.nameSet = new Set(
            settings.names.flatMap((name) => [lowerIn(lang, name), ...name.split(/\s+/u).map((part) => lowerIn(lang, part))]),
          );
          if (settings.lang) for (const word of ownWords(settings.lang)) store.ignored.add(lowerIn(lang, word));
          if (dispatch) tr.setMeta(spellKey, { refresh: true });
          store.kick?.();
          return true;
        },
      openSpell:
        (open) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(spellKey, { open });
          return true;
        },
      ignoreSpelling:
        (word) =>
        ({ tr, dispatch }) => {
          const store = this.storage as SpellStorage;
          store.ignored.add(lowerIn(store.lang ?? "tr", word));
          if (dispatch) tr.setMeta(spellKey, { refresh: true, open: null });
          return true;
        },
      refreshSpelling:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(spellKey, { refresh: true });
          return true;
        },
    };
  },
  addProseMirrorPlugins() {
    const store = () => this.storage as SpellStorage;
    const editor = this.editor;
    return [
      new Plugin<SpellState>({
        key: spellKey,
        state: {
          init: () => ({ decorations: DecorationSet.empty, open: null }),
          apply: (tr, previous, _old, state) => {
            const meta = tr.getMeta(spellKey) as { refresh?: boolean; open?: SpellOpen } | undefined;
            const open = meta && "open" in meta ? (meta.open ?? null) : tr.docChanged ? null : previous.open;
            if (tr.docChanged || meta?.refresh || tr.selectionSet) {
              return { decorations: build(state, store(), tr.docChanged), open };
            }
            return open === previous.open ? previous : { ...previous, open };
          },
        },
        props: {
          decorations: (state) => spellKey.getState(state)?.decorations ?? null,
          handleClick: (view, pos) => {
            const found = spellKey.getState(view.state)?.decorations.find(pos, pos);
            const hit = found?.find((d) => d.from <= pos && pos <= d.to);
            const word = hit ? (hit.spec as { word?: string }).word : undefined;
            if (hit && word) {
              editor.commands.openSpell({ from: hit.from, to: hit.to, word });
            } else if (spellKey.getState(view.state)?.open) {
              editor.commands.openSpell(null);
            }
            return false;
          },
        },
        // Asks the worker about words not seen yet, a moment after typing stops.
        view: (initial) => {
          let timer = 0;
          let alive = true;
          const run = async (state: EditorState) => {
            const s = store();
            if (!s.enabled || !s.lang) return;
            const lang = s.lang;
            await loadWords(lang);
            const checker = spellChecker(lang);
            if (!checker || !alive) return;
            const unseen = [...new Set(words(state.doc, s, lang).map((w) => w.word))].filter((w) => !s.known.has(w));
            if (unseen.length === 0) {
              if (!editor.isDestroyed) editor.commands.refreshSpelling();
              return;
            }
            for (let i = 0; i < unseen.length; i += 400) {
              const batch = unseen.slice(i, i + 400);
              const wrong = new Set(await checker.check(batch));
              if (!alive || s.lang !== lang) return;
              for (const word of batch) s.known.set(word, !wrong.has(word));
            }
            if (!editor.isDestroyed) editor.commands.refreshSpelling();
          };
          const schedule = (state: EditorState, delay: number) => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => void run(state), delay);
          };
          let current = initial;
          store().kick = () => schedule(current.state, 50);
          schedule(initial.state, 50);
          return {
            update: (view, previous) => {
              current = view;
              if (!view.state.doc.eq(previous.doc)) schedule(view.state, 700);
            },
            destroy: () => {
              alive = false;
              store().kick = null;
              window.clearTimeout(timer);
            },
          };
        },
      }),
    ];
  },
});

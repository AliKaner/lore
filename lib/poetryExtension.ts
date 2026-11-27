import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { RHYME_LABEL, analyzeStanza, type Lang } from "@/lib/poetry";

// While writing a poem: each line ends with its syllable count and rhyme
// letter, rhyming sounds are tinted by letter, redif is underlined, and
// every stanza closes with its scheme ("abab · çapraz uyak · 8 hece").
// A paragraph with line breaks is a stanza; so is a run of one-line
// paragraphs between empty ones.

export type PoetrySettings = { enabled: boolean; lang: Lang };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    poetryAid: { setPoetryAid: (settings: PoetrySettings) => ReturnType };
  }
  interface Storage {
    poetryAid: PoetrySettings;
  }
}

export const poetryKey = new PluginKey<DecorationSet>("poetryAid");

type Line = { text: string; end: number; map: number[] };

// The lines of the document with, for every character, its position.
function stanzasOf(doc: PMNode): Line[][] {
  const stanzas: Line[][] = [];
  let run: Line[] = [];
  const flush = () => {
    if (run.length > 0) stanzas.push(run);
    run = [];
  };
  doc.forEach((block, offset) => {
    if (!block.isTextblock) {
      flush();
      return;
    }
    const lines: Line[] = [];
    let current: Line = { text: "", end: offset + 1, map: [] };
    block.forEach((child, childOffset) => {
      const at = offset + 1 + childOffset;
      if (child.type.name === "hardBreak") {
        lines.push(current);
        current = { text: "", end: at + 1, map: [] };
        return;
      }
      if (child.isText && child.text) {
        for (let i = 0; i < child.text.length; i++) current.map.push(at + i);
        current.text += child.text;
        current.end = at + child.text.length;
      }
    });
    lines.push(current);
    const filled = lines.filter((l) => l.text.trim());
    if (filled.length === 0) flush();
    else if (lines.length > 1) {
      flush();
      stanzas.push(filled);
    } else run.push(filled[0]);
  });
  flush();
  return stanzas;
}

// The poem's own language for the labels: Turkish poetics in Turkish,
// the English names in English.
const EN: Record<string, string> = {
  beyit: "couplet",
  "düz uyak": "couplets",
  "çapraz uyak": "alternate rhyme",
  "sarma uyak": "enclosed rhyme",
  "mani düzeni": "mani form",
  "rubai düzeni": "rubaiyat form",
  "tek uyak": "monorhyme",
  "yarım uyak": "half rhyme",
  "tam uyak": "full rhyme",
  "zengin uyak": "rich rhyme",
  "yalnız redif": "repeated ending",
};
const say = (lang: Lang, text: string) => (lang === "en" ? (EN[text] ?? text) : text);

const LETTER_CLASS = ["poem-a", "poem-b", "poem-c", "poem-d", "poem-e"];
const letterClass = (letter: string) => LETTER_CLASS[(letter.charCodeAt(0) - 97) % LETTER_CLASS.length];

function build(doc: PMNode, settings: PoetrySettings): DecorationSet {
  if (!settings.enabled) return DecorationSet.empty;
  const marks: Decoration[] = [];
  for (const stanza of stanzasOf(doc)) {
    const info = analyzeStanza(settings.lang, stanza.map((l) => l.text));
    stanza.forEach((line, i) => {
      const meta = info.lines[i];
      // Where the letters of the line end, before closing punctuation.
      let last = line.text.length - 1;
      while (last >= 0 && !/\p{L}/u.test(line.text[last])) last--;
      if (meta.letter && meta.rhyme && last >= 0) {
        const cls = letterClass(meta.letter);
        const redifLen = meta.rhyme.redif.replace(/\s/gu, "").length;
        const rhymeLen = [...meta.rhyme.rhyme].length;
        // Count letters back from the end: redif first, then the rhyme.
        const positions: number[] = [];
        for (let k = last; k >= 0 && positions.length < redifLen + rhymeLen; k--) {
          if (/\p{L}/u.test(line.text[k])) positions.push(k);
        }
        positions.forEach((k, n) => {
          const from = line.map[k];
          if (from === undefined) return;
          marks.push(
            Decoration.inline(from, from + 1, {
              class: n < redifLen ? `poem-redif ${cls}` : `poem-rhyme ${cls}`,
            }),
          );
        });
      }
      const lang = settings.lang;
      const tip = meta.rhyme
        ? `${say(lang, RHYME_LABEL[meta.rhyme.kind])}${meta.rhyme.rhyme ? ` · -${meta.rhyme.rhyme}` : ""}${meta.rhyme.redif ? ` · ${lang === "en" ? "refrain" : "redif"}: ${meta.rhyme.redif}` : ""}`
        : "";
      marks.push(
        Decoration.widget(
          line.end,
          () => {
            const span = document.createElement("span");
            span.className = "poem-meta";
            span.contentEditable = "false";
            span.title = tip;
            span.textContent = String(meta.syllables);
            if (meta.letter) {
              const chip = document.createElement("b");
              chip.className = letterClass(meta.letter);
              chip.textContent = meta.letter;
              span.appendChild(chip);
            }
            return span;
          },
          { side: 1, key: `m${line.end}:${meta.syllables}:${meta.letter}:${tip}`, ignoreSelection: true },
        ),
      );
    });
    if (stanza.length > 1) {
      const end = stanza[stanza.length - 1].end;
      const lang = settings.lang;
      const summary = [
        info.scheme,
        info.name ? say(lang, info.name) : null,
        info.meter ? `${info.meter} ${lang === "en" ? "syllables" : "hece"}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      marks.push(
        Decoration.widget(
          end,
          () => {
            const div = document.createElement("span");
            div.className = "poem-stanza";
            div.contentEditable = "false";
            div.textContent = summary;
            return div;
          },
          { side: 2, key: `s${end}:${summary}`, ignoreSelection: true },
        ),
      );
    }
  }
  return DecorationSet.create(doc, marks);
}

export const PoetryAid = Extension.create({
  name: "poetryAid",
  addStorage(): PoetrySettings {
    return { enabled: false, lang: "tr" };
  },
  addCommands() {
    return {
      setPoetryAid:
        (settings) =>
        ({ tr, dispatch }) => {
          Object.assign(this.storage, settings);
          if (dispatch) tr.setMeta(poetryKey, true);
          return true;
        },
    };
  },
  addProseMirrorPlugins() {
    const settings = () => this.storage as PoetrySettings;
    return [
      new Plugin<DecorationSet>({
        key: poetryKey,
        state: {
          init: (_, { doc }) => build(doc, settings()),
          apply: (tr, previous) =>
            tr.docChanged || tr.getMeta(poetryKey) ? build(tr.doc, settings()) : previous.map(tr.mapping, tr.doc),
        },
        props: { decorations: (state) => poetryKey.getState(state) ?? null },
      }),
    ];
  },
});

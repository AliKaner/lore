// "@" mentions in an entity's long text: "Babasını @Aras Kader öldürdü."
//
// Stored as tokens that carry the id, so a rename never breaks a mention:
// `@[<id>|Aras Kader]`. While editing, the writer sees plain "@Aras Kader";
// the editor turns tokens into names when a field opens and names back into
// tokens when it saves, matching against the writer's own entities.

export type Mentionable = { _id: string; name: string };
export type Segment = string | { id: string; name: string };

const TOKEN = /@\[([a-z0-9]{8,64})\|([^\]\n]{0,200})\]/gu;
const WORD = /[\p{L}\p{N}_]/u;

// Splits stored text into plain runs and mentions.
export function parseMentions(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last) segments.push(text.slice(last, match.index));
    segments.push({ id: match[1], name: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push(text.slice(last));
  return segments;
}

// Stored text → what the writer edits. A mention shows its current name; one
// whose entity is gone falls back to the name it had.
export function toDisplay(text: string, entities: Mentionable[]): string {
  const names = new Map(entities.map((e) => [e._id, e.name]));
  return parseMentions(text)
    .map((s) => (typeof s === "string" ? s : `@${names.get(s.id) ?? s.name}`))
    .join("");
}

export type MentionRange = { start: number; end: number; id: string };

// Every "@Name" in edited text that names one of the entities. The longest
// name wins ("@Aras Kader" over "@Aras"), and a name must end at a word
// boundary ("@Arasta" is not "@Aras").
export function findMentions(text: string, entities: Mentionable[]): MentionRange[] {
  if (!text.includes("@")) return [];
  const byLength = [...entities].filter((e) => e.name).sort((a, b) => b.name.length - a.name.length);
  const ranges: MentionRange[] = [];
  let at = text.indexOf("@");
  while (at !== -1) {
    const before = at > 0 ? text[at - 1] : "";
    if (!before || !WORD.test(before)) {
      const hit = byLength.find((e) => {
        if (!text.startsWith(e.name, at + 1)) return false;
        const after = text[at + 1 + e.name.length];
        return after === undefined || !WORD.test(after);
      });
      if (hit) {
        const end = at + 1 + hit.name.length;
        ranges.push({ start: at, end, id: hit._id });
        at = text.indexOf("@", end);
        continue;
      }
    }
    at = text.indexOf("@", at + 1);
  }
  return ranges;
}

// What the writer edited → stored text.
export function toStored(text: string, entities: Mentionable[]): string {
  let out = "";
  let last = 0;
  for (const { start, end, id } of findMentions(text, entities)) {
    const name = text.slice(start + 1, end).replace(/[\]\n]/gu, "");
    out += `${text.slice(last, start)}@[${id}|${name}]`;
    last = end;
  }
  return out + text.slice(last);
}

// The "@query" the caret is in, if any: an "@" at the start of a word, with
// no line break between it and the caret.
export function activeMention(text: string, caret: number): { at: number; query: string } | null {
  const from = Math.max(0, caret - 60);
  const at = text.lastIndexOf("@", caret - 1);
  if (at < from) return null;
  const before = at > 0 ? text[at - 1] : "";
  if (before && WORD.test(before)) return null;
  const query = text.slice(at + 1, caret);
  if (query.includes("\n") || query.startsWith(" ") || query.includes("  ")) return null;
  return { at, query };
}

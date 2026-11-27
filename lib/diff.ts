// What changed between two versions of a chapter, word by word: paragraphs
// are matched first, then words inside the paragraphs that differ. Plain
// text only; formatting changes don't show.

export type Piece = { text: string; kind: "same" | "added" | "removed" };
export type ParagraphDiff = Piece[];

type Json = { type?: string; text?: string; content?: Json[] };

// A chapter's text as paragraphs.
export function paragraphs(content: string): string[] {
  try {
    const out: string[] = [];
    const walk = (node: Json, into: string[]) => {
      if (node.type === "text") {
        into.push(node.text ?? "");
        return;
      }
      if (node.type === "hardBreak") {
        into.push("\n");
        return;
      }
      const block = node.type === "paragraph" || node.type === "heading";
      if (block) {
        const parts: string[] = [];
        node.content?.forEach((child) => walk(child, parts));
        out.push(parts.join(""));
        return;
      }
      node.content?.forEach((child) => walk(child, into));
    };
    walk(JSON.parse(content) as Json, []);
    return out.filter((p, i, all) => p.trim() || (i > 0 && all[i - 1].trim()));
  } catch {
    return content
      .replace(/<\/(p|h\d|li)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
  }
}

// Longest common subsequence over two lists, as pairs of matching indexes.
function lcs<T>(a: T[], b: T[], same: (x: T, y: T) => boolean): [number, number][] {
  const n = a.length;
  const m = b.length;
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = same(a[i], b[j]) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (same(a[i], b[j])) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

const tokens = (text: string) => text.match(/\s+|[^\s]+/gu) ?? [];

export function diffWords(before: string, after: string): Piece[] {
  const a = tokens(before);
  const b = tokens(after);
  // Very long paragraphs: show as replaced rather than spend seconds.
  if (a.length * b.length > 400_000) {
    return [
      ...(before ? [{ text: before, kind: "removed" as const }] : []),
      ...(after ? [{ text: after, kind: "added" as const }] : []),
    ];
  }
  const pairs = lcs(a, b, (x, y) => x === y);
  const out: Piece[] = [];
  const push = (text: string, kind: Piece["kind"]) => {
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ text, kind });
  };
  let i = 0;
  let j = 0;
  for (const [pi, pj] of [...pairs, [a.length, b.length] as [number, number]]) {
    while (i < pi) push(a[i++], "removed");
    while (j < pj) push(b[j++], "added");
    if (pi < a.length) push(a[pi], "same");
    i = pi + 1;
    j = pj + 1;
  }
  return out;
}

// Paragraph by paragraph: unchanged ones whole, changed ones word by word.
export function diffChapters(before: string, after: string): ParagraphDiff[] {
  const a = paragraphs(before);
  const b = paragraphs(after);
  const pairs = lcs(a, b, (x, y) => x === y);
  const out: ParagraphDiff[] = [];
  let i = 0;
  let j = 0;
  for (const [pi, pj] of [...pairs, [a.length, b.length] as [number, number]]) {
    // Between matches: pair removed and added paragraphs up, word by word.
    const removed = a.slice(i, pi);
    const added = b.slice(j, pj);
    const n = Math.max(removed.length, added.length);
    for (let k = 0; k < n; k++) out.push(diffWords(removed[k] ?? "", added[k] ?? ""));
    if (pi < a.length) out.push([{ text: a[pi], kind: "same" }]);
    i = pi + 1;
    j = pj + 1;
  }
  return out;
}

export function changeCount(diff: ParagraphDiff[]) {
  let added = 0;
  let removed = 0;
  for (const para of diff) {
    for (const piece of para) {
      const words = piece.text.trim() ? piece.text.trim().split(/\s+/u).length : 0;
      if (piece.kind === "added") added += words;
      if (piece.kind === "removed") removed += words;
    }
  }
  return { added, removed };
}

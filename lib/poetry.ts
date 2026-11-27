// Reading a poem's form: syllables per line, which line endings rhyme and
// how (in Turkish terms: redif, the repeated ending; kafiye, the matching
// sounds before it), and each stanza's rhyme scheme.

export type Lang = "tr" | "en";

const TR_VOWELS = "aeıioöuüâîû";
const EN_VOWELS = "aeiouy";

const lower = (lang: Lang, s: string) => s.toLocaleLowerCase(lang === "tr" ? "tr-TR" : "en-US");
// Letters only, so "yandı," and "yandı!" end alike.
const letters = (s: string) => s.replace(/[^\p{L}\s']/gu, "").replace(/\s+/gu, " ").trim();

/* ---------- Syllables ---------- */

// Turkish: one syllable per vowel. English: vowel groups, with a silent
// final "e" dropped — close enough to count a line's beat.
export function syllables(lang: Lang, line: string): number {
  const text = lower(lang, letters(line));
  if (lang === "tr") return [...text].filter((ch) => TR_VOWELS.includes(ch)).length;
  let count = 0;
  for (const word of text.split(" ").filter(Boolean)) {
    const w = word.replace(/'/gu, "");
    let n = (w.match(/[aeiouy]+/gu) ?? []).length;
    if (w.length > 2 && w.endsWith("e") && !w.endsWith("le") && !/[aeiouy]e$/u.test(w)) n -= 1;
    count += Math.max(1, n);
  }
  return count;
}

/* ---------- Rhyme between two line endings ---------- */

// Common Turkish suffixes, longest first: an ending shared because of one
// of these is redif (an "ek redifi"), not rhyme.
const TR_SUFFIXES = [
  "acaksın", "eceksin", "mışsın", "mişsin", "muşsun", "müşsün", "acağım", "eceğim", "ıyorum", "iyorum", "uyorum", "üyorum",
  "ıyor", "iyor", "uyor", "üyor", "acak", "ecek", "mış", "miş", "muş", "müş", "ların", "lerin", "ları", "leri",
  "lar", "ler", "dır", "dir", "dur", "dür", "tır", "tir", "tur", "tür", "dım", "dim", "dum", "düm", "tım", "tim",
  "sın", "sin", "sun", "sün", "dan", "den", "tan", "ten", "ken", "dı", "di", "du", "dü", "tı", "ti", "tu", "tü",
  "ım", "im", "um", "üm", "ın", "in", "un", "ün", "da", "de", "ta", "te", "ca", "ce", "ça", "çe",
];

export type RhymeKind = "yarim" | "tam" | "zengin" | "redif";
export type Rhyme = {
  // How many matching sounds before the redif (the kafiye itself).
  sounds: number;
  kind: RhymeKind;
  // The shared ending, split into the rhyme and the redif after it.
  rhyme: string;
  redif: string;
};

function commonSuffix(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return a.slice(a.length - i);
}

const lastWords = (lang: Lang, line: string) => lower(lang, letters(line)).split(" ").filter(Boolean);

// Whether two lines rhyme, and how. Whole repeated words at the end and
// shared Turkish suffixes count as redif; the matching sounds before them
// are the rhyme: one sound is half rhyme (yarım), two full (tam), three or
// more rich (zengin).
export function rhymeOf(lang: Lang, a: string, b: string): Rhyme | null {
  const wa = lastWords(lang, a);
  const wb = lastWords(lang, b);
  if (wa.length === 0 || wb.length === 0) return null;
  // Whole words repeated at the end of both lines.
  const repeated: string[] = [];
  while (wa.length > 1 && wb.length > 1 && wa[wa.length - 1] === wb[wb.length - 1]) {
    repeated.unshift(wa.pop()!);
    wb.pop();
  }
  // English spelling: a silent final "e" doesn't sound ("are" rhymes with "star").
  const silentE = (w: string) => (lang === "en" && w.length >= 3 ? w.replace(/([^aeiouy])e$/u, "$1") : w);
  const x = silentE(wa[wa.length - 1]);
  const y = silentE(wb[wb.length - 1]);
  if (x === y && repeated.length === 0) {
    // The same last word: redif only (or cinas, which we can't hear).
    return { sounds: 0, kind: "redif", rhyme: "", redif: x };
  }
  let shared = commonSuffix(x, y);
  let suffix = "";
  if (lang === "tr") {
    for (const s of TR_SUFFIXES) {
      // Only when a real stem (three letters or more) is left before it.
      if (shared.endsWith(s) && x.length - s.length >= 3 && y.length - s.length >= 3) {
        suffix = s;
        shared = shared.slice(0, shared.length - s.length);
        break;
      }
    }
  }
  const redif = [suffix, ...repeated].filter(Boolean).join(" ").trim();
  const sounds = [...shared].length;
  if (lang === "en") {
    // English rhyme: the last vowel group and what follows must match.
    const tail = (w: string) => /[aeiouy]+[^aeiouy]*$/u.exec(w)?.[0] ?? w;
    if (sounds === 0 || !shared.endsWith(tail(x)) && tail(x) !== tail(y)) return null;
    return { sounds, kind: sounds >= 3 ? "zengin" : sounds === 2 ? "tam" : "yarim", rhyme: shared, redif };
  }
  if (sounds === 0) return redif ? { sounds: 0, kind: "redif", rhyme: "", redif } : null;
  return { sounds, kind: sounds >= 3 ? "zengin" : sounds === 2 ? "tam" : "yarim", rhyme: shared, redif };
}

/* ---------- Stanzas ---------- */

export type LineInfo = { text: string; syllables: number; letter: string | null; rhyme: Rhyme | null };
export type StanzaInfo = { lines: LineInfo[]; scheme: string; name: string | null; meter: string | null };

// Scheme names in Turkish poetics.
const SCHEMES: [RegExp, string][] = [
  [/^aa$/u, "beyit"],
  [/^aabb(cc)*$/u, "düz uyak"],
  [/^abab(cdcd)*$/u, "çapraz uyak"],
  [/^abba$/u, "sarma uyak"],
  [/^aa[x-]a$/u, "mani düzeni"],
  [/^aaba$/u, "rubai düzeni"],
  [/^aaaa+$/u, "tek uyak"],
];

// Lines rhyme together when they share a kafiye or redif strong enough to
// hear: two sounds, or one sound and a redif.
const strong = (r: Rhyme | null) => !!r && (r.sounds >= 2 || (r.sounds >= 1 && !!r.redif) || r.kind === "redif");

export function analyzeStanza(lang: Lang, lines: string[]): StanzaInfo {
  const letters: (string | null)[] = new Array(lines.length).fill(null);
  const rhymes: (Rhyme | null)[] = new Array(lines.length).fill(null);
  let next = 0;
  for (let i = 0; i < lines.length; i++) {
    if (letters[i]) continue;
    const group = [i];
    for (let j = i + 1; j < lines.length; j++) {
      if (letters[j]) continue;
      const r = rhymeOf(lang, lines[i], lines[j]);
      if (strong(r)) {
        group.push(j);
        rhymes[j] = r;
        if (!rhymes[i]) rhymes[i] = r;
      }
    }
    if (group.length > 1) {
      const letter = String.fromCharCode(97 + next++);
      for (const k of group) letters[k] = letter;
    }
  }
  // Lines that rhyme with nothing get their own letter, marked with "x"
  // where Turkish usage expects it (mani: aaxa).
  const scheme = letters.map((l) => l ?? "x").join("");
  const normalized = (() => {
    let n = 0;
    const map = new Map<string, string>();
    return letters
      .map((l) => {
        if (!l) return String.fromCharCode(97 + n++);
        if (!map.has(l)) map.set(l, String.fromCharCode(97 + n++));
        return map.get(l)!;
      })
      .join("");
  })();
  const name = SCHEMES.find(([re]) => re.test(scheme) || re.test(normalized))?.[1] ?? null;
  const counts = lines.map((l) => syllables(lang, l));
  const meter = counts.length > 1 && counts.every((c) => c === counts[0]) ? `${counts[0]}` : null;
  return {
    lines: lines.map((text, i) => ({ text, syllables: counts[i], letter: letters[i], rhyme: rhymes[i] })),
    scheme,
    name,
    meter,
  };
}

export const RHYME_LABEL: Record<RhymeKind, string> = {
  yarim: "yarım uyak",
  tam: "tam uyak",
  zengin: "zengin uyak",
  redif: "yalnız redif",
};

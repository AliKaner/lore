import { asciify, isCommonWord, isSubsequence, lowerIn, nearCommonWords, type Lang } from "@/lib/completion";

const upper = (lang: Lang, text: string) => text.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US");

// The dictionary's suggestions for a misspelled word, cleaned up: in the
// word's own case, no all-caps oddities, no repeats, common words first.
// Turkish typing slips come first: missing marks on ğ, ş, ı… and skipped
// letters, found among common words even when the dictionary misses them.
export function rankSuggestions(lang: Lang, word: string, raw: string[], limit = 5): string[] {
  const capital = word[0] !== lowerIn(lang, word[0]);
  const seen = new Set<string>();
  const plain = asciify(lowerIn(lang, word));
  const score = (s: string) => {
    const c = asciify(lowerIn(lang, s));
    if (c === plain) return 0;
    if (c.length > plain.length && c.slice(0, 2) === plain.slice(0, 2) && isSubsequence(plain, c)) return 1;
    return 2;
  };
  return [...nearCommonWords(lang, word), ...raw]
    .filter((s) => s === lowerIn(lang, s) || (s[0] !== lowerIn(lang, s[0]) && s.slice(1) === lowerIn(lang, s.slice(1))))
    .map((s) => (capital ? upper(lang, s[0]) + s.slice(1) : s))
    .filter((s) => {
      const key = lowerIn(lang, s);
      if (seen.has(key) || key === lowerIn(lang, word)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        score(a) - score(b) ||
        Number(isCommonWord(lang, lowerIn(lang, b))) - Number(isCommonWord(lang, lowerIn(lang, a))),
    )
    .slice(0, limit);
}

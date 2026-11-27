import { describe, expect, test } from "vitest";
import { buildIndex, completeWord, personalWords } from "./completion";

const tr = buildIndex(["gelecek", "geldi", "istiyorum", "ışığı", "için"]);
const en = buildIndex(["something", "should", "there"]);

describe("completion", () => {
  test("completes from the word list, most frequent first", () => {
    expect(completeWord("tr", "Yarın gel", tr, [])).toBe("ecek");
    expect(completeWord("tr", "Ben ist", tr, [])).toBe("iyorum");
    expect(completeWord("en", "I want som", en, [])).toBe("ething");
  });

  test("needs three letters and at least two to add", () => {
    expect(completeWord("tr", "ge", tr, [])).toBeNull();
    expect(completeWord("tr", "geldi", tr, [])).toBeNull();
    expect(completeWord("tr", "gelec", tr, [])).toBe("ek");
    expect(completeWord("tr", "gelece", tr, [])).toBeNull();
  });

  test("Turkish casing: I/ı and İ/i", () => {
    expect(completeWord("tr", "Işı", tr, [])).toBe("ğı");
    expect(completeWord("tr", "İst", tr, [])).toBe("iyorum");
    expect(completeWord("tr", "İSTİ", tr, [])).toBe("YORUM");
  });

  test("the writer's own words come first", () => {
    const own = personalWords("tr", "Gelincik yola çıktı. Gelincik durdu.", ["Selin Aras"]);
    expect(own).toEqual(["Selin", "Aras", "Gelincik"]);
    expect(completeWord("tr", "Bir gün Gel", tr, own)).toBe("incik");
    expect(completeWord("tr", "sonra Sel", tr, own)).toBe("in");
  });

  test("nothing without a word at the end", () => {
    expect(completeWord("tr", "geldi ", tr, [])).toBeNull();
    expect(completeWord("tr", "", tr, [])).toBeNull();
  });
});

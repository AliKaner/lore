import { describe, expect, test } from "vitest";
import { changeCount, diffChapters, diffWords, paragraphs } from "./diff";

const doc = (...paras: string[]) =>
  JSON.stringify({ type: "doc", content: paras.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })) });

describe("diff", () => {
  test("words added and removed", () => {
    expect(diffWords("Selin kapıyı açtı.", "Selin sessizce kapıyı açtı.")).toEqual([
      { text: "Selin ", kind: "same" },
      { text: "sessizce ", kind: "added" },
      { text: "kapıyı açtı.", kind: "same" },
    ]);
    expect(diffWords("eski metin", "yeni metin")).toEqual([
      { text: "eski", kind: "removed" },
      { text: "yeni", kind: "added" },
      { text: " metin", kind: "same" },
    ]);
  });

  test("paragraphs from a chapter", () => {
    expect(paragraphs(doc("Bir.", "İki."))).toEqual(["Bir.", "İki."]);
  });

  test("unchanged paragraphs stay whole", () => {
    const diff = diffChapters(doc("Aynı.", "Değişen bir cümle.", "Son."), doc("Aynı.", "Değişen yeni bir cümle.", "Son.", "Eklenen."));
    expect(diff[0]).toEqual([{ text: "Aynı.", kind: "same" }]);
    expect(diff[1].some((p) => p.kind === "added" && p.text.includes("yeni"))).toBe(true);
    expect(diff[3]).toEqual([{ text: "Eklenen.", kind: "added" }]);
    expect(changeCount(diff)).toEqual({ added: 2, removed: 0 });
  });
});

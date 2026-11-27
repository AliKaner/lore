import { describe, expect, test } from "vitest";
import { analyzeStanza, rhymeOf, syllables } from "./poetry";

describe("poetry", () => {
  test("Turkish syllables are vowels", () => {
    expect(syllables("tr", "Bir ihtiyar kadın oturmuş")).toBe(9);
    expect(syllables("tr", "Sis, ağır, durgun bir deniz!")).toBe(8);
    expect(syllables("en", "Twinkle twinkle little star")).toBe(7);
  });

  test("kafiye and redif", () => {
    // "yandı / kandı": -dı is redif, "an" is the rhyme: two sounds, tam.
    expect(rhymeOf("tr", "Gönlüm yine yandı", "Ateşe kandı")).toMatchObject({ kind: "tam", rhyme: "an", redif: "dı" });
    // "gül / dal" share one sound: yarım.
    expect(rhymeOf("tr", "Bahçede gül", "Elinde dal")?.kind).toBe("yarim");
    expect(rhymeOf("tr", "Bir kara gece", "Yine bir hece")).toMatchObject({ kind: "zengin", rhyme: "ece" });
    // Whole word repeated: redif.
    expect(rhymeOf("tr", "Gel bana gel", "Yine gel")).toMatchObject({ kind: "redif" });
    expect(rhymeOf("en", "Twinkle twinkle little star", "How I wonder what you are")).toMatchObject({ rhyme: "ar" });
  });

  test("stanza schemes", () => {
    const duz = analyzeStanza("tr", ["Gönlüm yine yandı", "Ateşe kandı", "Bir kara gece", "Yine bir hece"]);
    expect(duz.scheme).toBe("aabb");
    expect(duz.name).toBe("düz uyak");
    const capraz = analyzeStanza("tr", ["Bir kara gece", "Gönlüm yine yandı", "Yine bir hece", "Ateşe kandı"]);
    expect(capraz.name).toBe("çapraz uyak");
    const mani = analyzeStanza("tr", ["Bir kara gece", "Yine bir hece", "Ay doğmadı", "Bu ne bilmece"]);
    expect(mani.scheme).toBe("aaxa");
    expect(mani.name).toBe("mani düzeni");
  });
});

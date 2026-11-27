import { describe, expect, test } from "vitest";
import { asciify } from "./completion";
import { rankSuggestions } from "./spellSuggest";

describe("spelling suggestions", () => {
  test("missing Turkish marks and skipped letters come first", () => {
    expect(asciify("gideceğiz")).toBe("gidecegiz");
    expect(rankSuggestions("tr", "gidecegiz", ["giderdi", "gideceğiz"])[0]).toBe("gideceğiz");
    expect(rankSuggestions("tr", "Yarn", ["yara", "yarın"])[0]).toBe("Yarın");
    expect(rankSuggestions("tr", "alacagz", ["alamaz", "alacağız"])[0]).toBe("alacağız");
  });
});

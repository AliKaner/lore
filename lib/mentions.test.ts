import { describe, expect, test } from "vitest";
import { activeMention, findMentions, parseMentions, toDisplay, toStored } from "./mentions";

const aras = { _id: "k17aras000000000", name: "Aras" };
const arasKader = { _id: "k17araskader0000", name: "Aras Kader" };
const iskele = { _id: "k17iskele0000000", name: "İskele" };
const all = [aras, arasKader, iskele];

describe("mentions", () => {
  test("names become tokens and back", () => {
    const edited = "Babasını @Aras Kader öldürdü, @İskele'de.";
    const stored = toStored(edited, all);
    expect(stored).toBe(
      "Babasını @[k17araskader0000|Aras Kader] öldürdü, @[k17iskele0000000|İskele]'de.",
    );
    expect(toDisplay(stored, all)).toBe(edited);
  });

  test("longest name wins, word boundary required", () => {
    expect(findMentions("@Aras Kader", all)).toEqual([{ start: 0, end: 11, id: arasKader._id }]);
    expect(findMentions("@Aras geldi", all)).toEqual([{ start: 0, end: 5, id: aras._id }]);
    expect(findMentions("@Arasta", all)).toEqual([]);
    expect(findMentions("mail@Aras", all)).toEqual([]);
  });

  test("a rename shows the new name; a deleted entity keeps the old one", () => {
    const stored = "Kardeşi @[k17aras000000000|Aras].";
    expect(toDisplay(stored, [{ _id: aras._id, name: "Arasel" }])).toBe("Kardeşi @Arasel.");
    expect(toDisplay(stored, [])).toBe("Kardeşi @Aras.");
    expect(toStored("Kardeşi @Aras.", [])).toBe("Kardeşi @Aras.");
  });

  test("parse splits text and mentions", () => {
    expect(parseMentions("a @[k17aras000000000|Aras] b")).toEqual(["a ", { id: aras._id, name: "Aras" }, " b"]);
    expect(parseMentions("no mentions")).toEqual(["no mentions"]);
  });

  test("active query at the caret", () => {
    expect(activeMention("Selam @Ar", 9)).toEqual({ at: 6, query: "Ar" });
    expect(activeMention("Selam @Aras K", 13)).toEqual({ at: 6, query: "Aras K" });
    expect(activeMention("Selam @", 7)).toEqual({ at: 6, query: "" });
    expect(activeMention("mail@x", 6)).toBeNull();
    expect(activeMention("@a\nb", 4)).toBeNull();
    expect(activeMention("@ a", 3)).toBeNull();
  });
});

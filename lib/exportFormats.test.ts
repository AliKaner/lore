// @vitest-environment node
import { describe, expect, test } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { slugify, toDocx, toMarkdown, type ExportData } from "./exportFormats";

const chapter = (
  title: string,
  content: object,
  extra: Partial<ExportData["chapters"][number]> = {},
): ExportData["chapters"][number] => ({
  _id: title as never,
  title,
  content: JSON.stringify(content),
  status: "published",
  depth: 0,
  onMainLine: true,
  byOwner: true,
  ...extra,
});

const data: ExportData = {
  book: {
    _id: "b" as never,
    title: "Kuzey Limanı",
    description: "Sisli bir liman kenti",
    kind: "book",
    visibility: "private",
    createdAt: 0,
  },
  chapters: [
    chapter("Sis", {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Sabah" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Selin " },
            { type: "text", text: "bekliyordu", marks: [{ type: "bold" }] },
            { type: "text", text: " ve " },
            {
              type: "text",
              text: "tekne dönmedi",
              marks: [{ type: "authorNote", attrs: { note: "tekne batmadı" } }],
            },
          ],
        },
        { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "Rüzgâr döndü." }] }] },
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "harita" }] }] },
            { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "pusula" }] }] },
          ],
        },
      ],
    }),
    chapter(
      "Başka yol",
      { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Dal metni" }] }] },
      { onMainLine: false, depth: 1, status: "draft" },
    ),
  ],
};

describe("markdown export", () => {
  test("keeps structure and formatting, main line only by default", () => {
    const md = toMarkdown(data, { scope: "main", includeNotes: false });
    expect(md).toContain("# Kuzey Limanı");
    expect(md).toContain("## Sis");
    expect(md).toContain("### Sabah");
    expect(md).toContain("Selin **bekliyordu** ve tekne dönmedi");
    expect(md).toContain("> Rüzgâr döndü.");
    expect(md).toContain("- harita\n- pusula");
    expect(md).not.toContain("Başka yol");
    expect(md).not.toContain("tekne batmadı");
  });

  test("the backup adds branches, drafts and notes as footnotes", () => {
    const md = toMarkdown(data, { scope: "all", includeNotes: true });
    expect(md).toContain("tekne dönmedi[^1]");
    expect(md).toContain("[^1]: Not: tekne batmadı");
    expect(md).toContain("## Dal · Başka yol (taslak)");
  });
});

describe("word export", () => {
  test("produces a real .docx with the text in it", async () => {
    const blob = await toDocx(data, "main");
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const xml = strFromU8(files["word/document.xml"]);
    expect(xml).toContain("Kuzey Limanı");
    expect(xml).toContain("bekliyordu");
    expect(xml).toContain("Rüzgâr döndü.");
    expect(xml).not.toContain("tekne batmadı");
    expect(xml).not.toContain("Dal metni");
  });
});

test("file names are readable ASCII", () => {
  expect(slugify("Kuzey Limanı: Şişli Günler!")).toBe("kuzey-limani-sisli-gunler");
  expect(slugify("???")).toBe("yazi");
});

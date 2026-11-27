// @vitest-environment node
import { describe, expect, test } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { toEpub } from "./epub";
import type { ExportData } from "./exportFormats";

const data: ExportData = {
  book: {
    _id: "b" as never,
    title: "Kuzey & Limanı",
    description: "Sisli bir liman kenti",
    kind: "book",
    visibility: "private",
    createdAt: 0,
    language: "tr",
    author: "yazar",
    coverUrl: null,
  },
  chapters: [
    {
      _id: "c1" as never,
      title: "Sis",
      content: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Selin " },
              { type: "text", text: "bekliyordu", marks: [{ type: "bold" }] },
              { type: "text", text: " <burada>", marks: [{ type: "authorNote", attrs: { note: "gizli not" } }] },
            ],
          },
        ],
      }),
      status: "published",
      depth: 0,
      onMainLine: true,
      byOwner: true,
    },
    {
      _id: "c2" as never,
      title: "Dal",
      content: "",
      status: "published",
      depth: 1,
      onMainLine: false,
      byOwner: true,
    },
  ],
};

describe("epub", () => {
  test("is a valid EPUB 3 package", async () => {
    const blob = await toEpub(data, "main", "en");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    // The mimetype is the first file, stored uncompressed.
    expect(strFromU8(bytes.slice(30, 38))).toBe("mimetype");
    expect(strFromU8(bytes.slice(38, 58))).toBe("application/epub+zip");
    const files = unzipSync(bytes);
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(["META-INF/container.xml", "OEBPS/content.opf", "OEBPS/nav.xhtml", "OEBPS/toc.ncx", "OEBPS/chapter-001.xhtml"]),
    );
    // Only the main line.
    expect(files["OEBPS/chapter-002.xhtml"]).toBeUndefined();
    const opf = strFromU8(files["OEBPS/content.opf"]);
    expect(opf).toContain("<dc:title>Kuzey &amp; Limanı</dc:title>");
    expect(opf).toContain("<dc:language>tr</dc:language>");
    expect(opf).toContain("<dc:creator>yazar</dc:creator>");
    const first = strFromU8(files["OEBPS/chapter-001.xhtml"]);
    expect(first).toContain("<strong>bekliyordu</strong>");
    expect(first).toContain("&lt;burada&gt;");
    expect(first).not.toContain("gizli not");
    expect(strFromU8(files["OEBPS/nav.xhtml"])).toContain("İçindekiler");
  });
});

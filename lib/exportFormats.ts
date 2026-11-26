import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import { KINDS } from "@/lib/writingKinds";

// Turning a writing into files the writer owns: Markdown (also the backup
// format) and Word. PDF goes through the print page instead.

export type ExportData = NonNullable<FunctionReturnType<typeof api.exports.bookForExport>>;
export type ExportChapter = ExportData["chapters"][number];
export type Scope = "main" | "all";

type Mark = { type: string; attrs?: Record<string, unknown> };
type Node = { type?: string; text?: string; marks?: Mark[]; attrs?: Record<string, unknown>; content?: Node[] };

function parse(content: string): Node {
  try {
    return JSON.parse(content) as Node;
  } catch {
    // Old chapters stored as HTML: keep the words, one paragraph per block.
    const paragraphs = content
      .replace(/<\/(p|h\d|li|blockquote)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return {
      type: "doc",
      content: paragraphs.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })),
    };
  }
}

export function chaptersIn(data: ExportData, scope: Scope) {
  return scope === "main" ? data.chapters.filter((c) => c.onMainLine) : data.chapters;
}

export function slugify(text: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  const slug = text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıİöşüâîû]/gu, (ch) => map[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60);
  return slug || "yazi";
}

function chapterHeading(chapter: ExportChapter) {
  const branch = chapter.onMainLine ? "" : "Dal · ";
  const draft = chapter.status === "draft" ? " (taslak)" : "";
  return `${branch}${chapter.title}${draft}`;
}

/* ---------- Markdown ---------- */

function mdInline(nodes: Node[] | undefined, notes: string[] | null): string {
  let out = "";
  for (const node of nodes ?? []) {
    if (node.type === "hardBreak") {
      out += "  \n";
      continue;
    }
    if (node.type !== "text") continue;
    let text = node.text ?? "";
    const marks = node.marks ?? [];
    const has = (type: string) => marks.some((m) => m.type === type);
    if (has("code")) text = `\`${text}\``;
    if (has("bold")) text = `**${text}**`;
    if (has("italic")) text = `_${text}_`;
    if (has("strike")) text = `~~${text}~~`;
    const note = marks.find((m) => m.type === "authorNote");
    if (note && notes) {
      notes.push(String(note.attrs?.note ?? ""));
      text = `${text}[^${notes.length}]`;
    }
    out += text;
  }
  return out;
}

function mdBlocks(nodes: Node[] | undefined, notes: string[] | null, indent = ""): string[] {
  const lines: string[] = [];
  for (const node of nodes ?? []) {
    switch (node.type) {
      case "paragraph":
        lines.push(indent + mdInline(node.content, notes), "");
        break;
      case "heading":
        lines.push(`${"#".repeat(Math.min(6, Number(node.attrs?.level ?? 2) + 1))} ${mdInline(node.content, notes)}`, "");
        break;
      case "blockquote":
        for (const line of mdBlocks(node.content, notes)) lines.push(line ? `> ${line}` : ">");
        break;
      case "bulletList":
      case "orderedList":
        (node.content ?? []).forEach((item, i) => {
          const bullet = node.type === "bulletList" ? "- " : `${i + 1}. `;
          const inner = mdBlocks(item.content, notes).filter(Boolean);
          inner.forEach((line, j) => lines.push((j === 0 ? bullet : "   ") + line));
        });
        lines.push("");
        break;
      case "horizontalRule":
        lines.push("---", "");
        break;
      default:
        lines.push(...mdBlocks(node.content, notes, indent));
    }
  }
  return lines;
}

export function toMarkdown(
  data: ExportData,
  { scope, includeNotes }: { scope: Scope; includeNotes: boolean },
) {
  const out: string[] = [`# ${data.book.title}`, ""];
  const kind = KINDS[data.book.kind]?.label;
  if (kind) out.push(`_${kind}_`, "");
  if (data.book.description) out.push(data.book.description, "");
  for (const chapter of chaptersIn(data, scope)) {
    const notes: string[] | null = includeNotes ? [] : null;
    out.push(`## ${chapterHeading(chapter)}`, "");
    out.push(...mdBlocks(parse(chapter.content).content, notes));
    if (notes && notes.length > 0) {
      notes.forEach((note, i) => out.push(`[^${i + 1}]: Not: ${note}`));
      out.push("");
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ---------- Word ---------- */

export async function toDocx(data: ExportData, scope: Scope): Promise<Blob> {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  const runs = (nodes: Node[] | undefined, italicAll = false) => {
    const out: InstanceType<typeof TextRun>[] = [];
    for (const node of nodes ?? []) {
      if (node.type === "hardBreak") {
        out.push(new TextRun({ text: "", break: 1 }));
        continue;
      }
      if (node.type !== "text") continue;
      const has = (type: string) => (node.marks ?? []).some((m) => m.type === type);
      out.push(
        new TextRun({
          text: node.text ?? "",
          bold: has("bold"),
          italics: italicAll || has("italic"),
          strike: has("strike"),
        }),
      );
    }
    return out;
  };

  const blocks = (nodes: Node[] | undefined, quote = false): InstanceType<typeof Paragraph>[] => {
    const out: InstanceType<typeof Paragraph>[] = [];
    for (const node of nodes ?? []) {
      switch (node.type) {
        case "paragraph":
          out.push(
            new Paragraph({
              children: runs(node.content, quote),
              indent: quote ? { left: 720 } : undefined,
              spacing: { after: 160, line: 360 },
            }),
          );
          break;
        case "heading":
          out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs(node.content) }));
          break;
        case "blockquote":
          out.push(...blocks(node.content, true));
          break;
        case "bulletList":
        case "orderedList":
          (node.content ?? []).forEach((item, i) => {
            const first = (item.content ?? [])[0];
            const prefix = node.type === "orderedList" ? [new TextRun(`${i + 1}. `)] : [];
            out.push(
              new Paragraph({
                bullet: node.type === "bulletList" ? { level: 0 } : undefined,
                indent: node.type === "orderedList" ? { left: 360 } : undefined,
                children: [...prefix, ...runs(first?.content)],
                spacing: { after: 80 },
              }),
            );
          });
          break;
        default:
          out.push(...blocks(node.content, quote));
      }
    }
    return out;
  };

  const kind = KINDS[data.book.kind]?.label;
  const titlePage = [
    new Paragraph({ text: "", spacing: { before: 2400 } }),
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun(data.book.title)] }),
    ...(kind
      ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: kind, italics: true })] })]
      : []),
    ...(data.book.description
      ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun(data.book.description)] })]
      : []),
  ];

  const body = chaptersIn(data, scope).flatMap((chapter) => [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      spacing: { after: 360 },
      children: [new TextRun(chapterHeading(chapter))],
    }),
    ...blocks(parse(chapter.content).content),
  ]);

  const document = new Document({
    creator: "Booktion",
    title: data.book.title,
    styles: {
      default: {
        document: { run: { font: "Garamond", size: 24 } },
        title: { run: { font: "Garamond", size: 56 } },
        heading1: { run: { font: "Garamond", size: 36 } },
        heading2: { run: { font: "Garamond", size: 28 } },
      },
    },
    sections: [{ children: [...titlePage, ...body] }],
  });
  return Packer.toBlob(document);
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

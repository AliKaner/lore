/** Minimal Tiptap JSON -> Markdown serializer, covering the node/mark set PagesEditor actually uses. */

interface TNode {
  type?: string;
  text?: string;
  attrs?: Record<string, any>;
  marks?: { type: string; attrs?: Record<string, any> }[];
  content?: TNode[];
}

function textWithMarks(node: TNode): string {
  let text = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") text = `**${text}**`;
    else if (mark.type === "italic") text = `_${text}_`;
    else if (mark.type === "strike") text = `~~${text}~~`;
    else if (mark.type === "code") text = `\`${text}\``;
    else if (mark.type === "underline") text = `<u>${text}</u>`;
    else if (mark.type === "link" && mark.attrs?.href) text = `[${text}](${mark.attrs.href})`;
  }
  return text;
}

function inline(nodes: TNode[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((n) => {
      if (n.type === "text") return textWithMarks(n);
      if (n.type === "hardBreak") return "  \n";
      if (n.type === "wikiLink") return `**${n.attrs?.label ?? ""}**`;
      if (n.type === "image") return `![${n.attrs?.alt ?? ""}](${n.attrs?.src ?? ""})`;
      return inline(n.content);
    })
    .join("");
}

function listItems(items: TNode[], ordered: boolean, depth: number): string {
  const indent = "  ".repeat(depth);
  return items
    .map((item, i) => {
      const marker = ordered ? `${i + 1}.` : "-";
      const body = (item.content ?? [])
        .map((child) => blockToMarkdown(child, depth + 1))
        .join("\n")
        .trim();
      return `${indent}${marker} ${body}`;
    })
    .join("\n");
}

function tableToMarkdown(node: TNode): string {
  const rows = node.content ?? [];
  const cellText = (cell: TNode) => inline((cell.content ?? []).flatMap((p) => p.content ?? [])).replace(/\|/g, "\\|") || " ";
  const lines = rows.map((row) => `| ${(row.content ?? []).map(cellText).join(" | ")} |`);
  if (lines.length) {
    const colCount = (rows[0]?.content ?? []).length;
    lines.splice(1, 0, `| ${Array(colCount).fill("---").join(" | ")} |`);
  }
  return lines.join("\n");
}

function blockToMarkdown(node: TNode, depth = 0): string {
  switch (node.type) {
    case "paragraph":
      return inline(node.content);
    case "heading": {
      const level = Math.min(6, Math.max(1, node.attrs?.level ?? 1));
      return `${"#".repeat(level)} ${inline(node.content)}`;
    }
    case "bulletList":
      return listItems(node.content ?? [], false, depth);
    case "orderedList":
      return listItems(node.content ?? [], true, depth);
    case "blockquote":
      return (node.content ?? [])
        .map((child) => blockToMarkdown(child, depth))
        .join("\n")
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "codeBlock":
      return `\`\`\`\n${(node.content ?? []).map((t) => t.text ?? "").join("")}\n\`\`\``;
    case "horizontalRule":
      return "---";
    case "image":
      return `![${node.attrs?.alt ?? ""}](${node.attrs?.src ?? ""})`;
    case "table":
      return tableToMarkdown(node);
    default:
      return (node.content ?? []).map((child) => blockToMarkdown(child, depth)).join("\n\n");
  }
}

export function tiptapJsonToMarkdown(json: string): string {
  let doc: TNode;
  try {
    doc = JSON.parse(json);
  } catch {
    return json;
  }
  return (doc.content ?? [])
    .map((node) => blockToMarkdown(node))
    .filter((block) => block.trim().length > 0)
    .join("\n\n")
    .trim();
}

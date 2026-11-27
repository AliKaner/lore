import { chapterHeading, chaptersIn, parse, type ExportData, type Node, type Scope } from "@/lib/exportFormats";

// An EPUB 3 e-book (with an EPUB 2 table of contents for older readers):
// the cover if there is one, a title page, one file per chapter. Opens in
// Apple Books, Google Play Books and Kobo; Kindle takes it through
// "Send to Kindle". Author notes stay out.

const xml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(nodes: Node[] | undefined): string {
  let out = "";
  for (const node of nodes ?? []) {
    if (node.type === "hardBreak") {
      out += "<br/>";
      continue;
    }
    if (node.type !== "text") continue;
    let text = xml(node.text ?? "");
    const marks = node.marks ?? [];
    const has = (type: string) => marks.some((m) => m.type === type);
    if (has("code")) text = `<code>${text}</code>`;
    if (has("bold")) text = `<strong>${text}</strong>`;
    if (has("italic")) text = `<em>${text}</em>`;
    if (has("strike")) text = `<s>${text}</s>`;
    out += text;
  }
  return out;
}

function blocks(nodes: Node[] | undefined): string {
  let out = "";
  for (const node of nodes ?? []) {
    switch (node.type) {
      case "paragraph":
        out += `<p>${inline(node.content) || "&#160;"}</p>\n`;
        break;
      case "heading":
        out += `<h3>${inline(node.content)}</h3>\n`;
        break;
      case "blockquote":
        out += `<blockquote>${blocks(node.content)}</blockquote>\n`;
        break;
      case "bulletList":
      case "orderedList": {
        const tag = node.type === "bulletList" ? "ul" : "ol";
        const items = (node.content ?? []).map((item) => `<li>${blocks(item.content)}</li>`).join("");
        out += `<${tag}>${items}</${tag}>\n`;
        break;
      }
      case "horizontalRule":
        out += `<hr/>\n`;
        break;
      default:
        out += blocks(node.content);
    }
  }
  return out;
}

const page = (lang: string, title: string, body: string) =>
  [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE html>`,
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">`,
    `<head><meta charset="UTF-8"/><title>${xml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>`,
    `<body>`,
    body,
    `</body>`,
    `</html>`,
    ``,
  ].join("\n");

const CSS = `body { font-family: serif; line-height: 1.55; margin: 0 5%; }
h1 { font-size: 1.9em; text-align: center; margin: 3em 0 0.4em; font-weight: normal; }
h2 { font-size: 1.45em; text-align: center; margin: 2.5em 0 1.5em; font-weight: normal; }
h3 { font-size: 1.15em; margin: 1.6em 0 0.6em; }
p { margin: 0; text-indent: 1.4em; text-align: justify; }
h2 + p, h3 + p, hr + p, blockquote p { text-indent: 0; }
blockquote { margin: 1em 1.5em; font-style: italic; }
hr { border: 0; margin: 1.5em 0; text-align: center; }
.title-page { text-align: center; }
.author { text-align: center; font-style: italic; margin-top: 0.5em; text-indent: 0; }
.description { margin-top: 3em; text-align: center; text-indent: 0; }
.cover { text-align: center; margin: 0; padding: 0; }
.cover img { max-width: 100%; max-height: 100%; }
`;

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

async function fetchCover(url: string | null) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = IMAGE_EXT[type];
    if (!ext) return null;
    return { bytes: new Uint8Array(await res.arrayBuffer()), type, ext };
  } catch {
    return null;
  }
}

export async function toEpub(data: ExportData, scope: Scope, fallbackLang: "tr" | "en"): Promise<Blob> {
  const { zipSync, strToU8 } = await import("fflate");
  const lang = data.book.language ?? fallbackLang;
  const id = `urn:uuid:${uuid()}`;
  const title = data.book.title;
  const author = data.book.author ?? "";
  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const cover = await fetchCover(data.book.coverUrl);

  const files: Record<string, Uint8Array> = {};
  const manifest: string[] = [];
  const spine: string[] = [];
  const toc: { file: string; title: string }[] = [];

  if (cover) {
    files[`OEBPS/cover.${cover.ext}`] = cover.bytes;
    manifest.push(`<item id="cover-image" href="cover.${cover.ext}" media-type="${cover.type}" properties="cover-image"/>`);
    files["OEBPS/cover.xhtml"] = strToU8(
      page(lang, title, `<div class="cover"><img src="cover.${cover.ext}" alt="${xml(title)}"/></div>`),
    );
    manifest.push(`<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="cover" linear="no"/>`);
  }

  const titlePage = [
    `<section class="title-page" epub:type="titlepage">`,
    `<h1>${xml(title)}</h1>`,
    author ? `<p class="author">${xml(author)}</p>` : "",
    data.book.description ? `<p class="description">${xml(data.book.description)}</p>` : "",
    `</section>`,
  ].join("\n");
  files["OEBPS/title.xhtml"] = strToU8(page(lang, title, titlePage));
  manifest.push(`<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`);
  spine.push(`<itemref idref="title"/>`);

  chaptersIn(data, scope).forEach((chapter, i) => {
    const file = `chapter-${String(i + 1).padStart(3, "0")}.xhtml`;
    const heading = chapterHeading(chapter);
    const body = `<section epub:type="chapter">\n<h2>${xml(heading)}</h2>\n${blocks(parse(chapter.content).content)}</section>`;
    files[`OEBPS/${file}`] = strToU8(page(lang, heading, body));
    manifest.push(`<item id="c${i + 1}" href="${file}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="c${i + 1}"/>`);
    toc.push({ file, title: heading });
  });

  const tocLabel = lang === "tr" ? "İçindekiler" : "Contents";
  const navList = toc.map((n) => `<li><a href="${n.file}">${xml(n.title)}</a></li>`).join("\n");
  files["OEBPS/nav.xhtml"] = strToU8(
    page(lang, tocLabel, `<nav epub:type="toc" id="toc"><h2>${tocLabel}</h2><ol>\n${navList}\n</ol></nav>`),
  );
  manifest.push(`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);

  const navPoints = toc
    .map(
      (n, i) =>
        `<navPoint id="n${i + 1}" playOrder="${i + 1}"><navLabel><text>${xml(n.title)}</text></navLabel><content src="${n.file}"/></navPoint>`,
    )
    .join("\n");
  files["OEBPS/toc.ncx"] = strToU8(
    [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${lang}">`,
      `<head><meta name="dtb:uid" content="${id}"/><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head>`,
      `<docTitle><text>${xml(title)}</text></docTitle>`,
      `<navMap>`,
      navPoints,
      `</navMap>`,
      `</ncx>`,
      ``,
    ].join("\n"),
  );
  manifest.push(`<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`);

  files["OEBPS/style.css"] = strToU8(CSS);
  manifest.push(`<item id="css" href="style.css" media-type="text/css"/>`);

  files["OEBPS/content.opf"] = strToU8(
    [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${lang}">`,
      `<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">`,
      `<dc:identifier id="book-id">${id}</dc:identifier>`,
      `<dc:title>${xml(title)}</dc:title>`,
      `<dc:language>${lang}</dc:language>`,
      author ? `<dc:creator>${xml(author)}</dc:creator>` : "",
      data.book.description ? `<dc:description>${xml(data.book.description)}</dc:description>` : "",
      `<meta property="dcterms:modified">${modified}</meta>`,
      cover ? `<meta name="cover" content="cover-image"/>` : "",
      `</metadata>`,
      `<manifest>`,
      ...manifest,
      `</manifest>`,
      `<spine toc="ncx">`,
      ...spine,
      `</spine>`,
      `</package>`,
      ``,
    ]
      .filter((line, i, all) => line !== "" || i === all.length - 1)
      .join("\n"),
  );

  files["META-INF/container.xml"] = strToU8(
    [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">`,
      `<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>`,
      `</container>`,
      ``,
    ].join("\n"),
  );

  // The mimetype comes first and uncompressed, as readers require.
  const rest = Object.fromEntries(
    Object.entries(files).map(([path, bytes]) => [path, [bytes, { level: 9 as const }] as const]),
  );
  const zipped = zipSync({ mimetype: [strToU8("application/epub+zip"), { level: 0 }], ...rest });
  return new Blob([zipped as BlobPart], { type: "application/epub+zip" });
}

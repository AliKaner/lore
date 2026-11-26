// @vitest-environment node
import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { EN } from "@/lib/i18n/en";
import { translate } from "@/lib/i18n";
import { ENTITY_KINDS } from "@/convex/entityKinds";
import { KINDS } from "@/lib/writingKinds";
import { THEMES } from "@/lib/themes";
import { PAPERS } from "@/lib/paper";
import { SOUNDS } from "@/lib/writingModes";

const root = path.resolve(__dirname, "..");

function files(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === "node_modules" || name === "_generated" || name.startsWith(".")) continue;
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.(tsx?|ts)$/u.test(name) && !/\.test\.tsx?$/u.test(name)) out.push(full);
  }
  return out;
}

// Every literal passed to t("…"), across the app.
function translatedLiterals() {
  const found = new Map<string, string>();
  const call = /\bt\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/gu;
  for (const file of [...files(path.join(root, "app")), ...files(path.join(root, "components")), ...files(path.join(root, "lib"))]) {
    if (file.includes(`${path.sep}i18n${path.sep}`)) continue;
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(call)) {
      if (match[1] === "`" && match[2].includes("${")) continue;
      const text = match[2].replace(/\\(["'`\\])/gu, "$1");
      found.set(text, path.relative(root, file));
    }
  }
  return found;
}

// Every message a Convex function throws at the user.
function serverMessages() {
  const found = new Map<string, string>();
  for (const file of files(path.join(root, "convex"))) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/throw new Error\(\s*(["`])((?:\\.|(?!\1)[^\\])*)\1/gu)) {
      found.set(match[2], path.relative(root, file));
    }
  }
  return found;
}

function stringsIn(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => stringsIn(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => stringsIn(v, out));
  return out;
}

const missing = (texts: Iterable<string>) => [...texts].filter((text) => text.trim() && EN[text] === undefined);

describe("English", () => {
  test("every t() string has an English version", () => {
    const literals = translatedLiterals();
    const gaps = missing(literals.keys()).map((text) => `${literals.get(text)}: ${text}`);
    expect(gaps).toEqual([]);
  });

  test("every server error has an English version", () => {
    const messages = serverMessages();
    const gaps = missing([...messages.keys()].filter((m) => !m.includes("${"))).map(
      (text) => `${messages.get(text)}: ${text}`,
    );
    expect(gaps).toEqual([]);
  });

  test("kinds, themes, papers and sounds read in English", () => {
    const skip = new Set(["key", "type", "slug", "glyph", "id", "kinds", "swatch", "scheme"]);
    const labels: string[] = [];
    const collect = (value: unknown) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [key, inner] of Object.entries(value)) if (!skip.has(key)) collect(inner);
      } else if (Array.isArray(value)) value.forEach(collect);
      else if (typeof value === "string") labels.push(value);
    };
    collect(ENTITY_KINDS);
    collect(Object.values(KINDS).map(({ template: _template, ...rest }) => rest));
    collect(THEMES);
    collect(PAPERS.map((p) => ({ note: p.note })));
    collect(SOUNDS);
    expect(missing(labels.filter((l) => /\p{L}/u.test(l) && !/^[A-Z]\d$/u.test(l)))).toEqual([]);
    expect(stringsIn([]).length).toBe(0);
  });

  test("placeholders and plurals fill in", () => {
    expect(translate("tr", "{n} kelime", { n: 3 })).toBe("3 kelime");
    expect(translate("en", "{n} kelime", { n: 1 })).toBe("1 word");
    expect(translate("en", "{n} kelime", { n: 3 })).toBe("3 words");
    // A wrapped server error is matched by its message.
    expect(
      translate("en", "[CONVEX M(books:update)] Server Error\nUncaught Error: Giriş yapmalısın.\n    at handler"),
    ).toBe("You need to sign in.");
  });
});

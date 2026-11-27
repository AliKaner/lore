/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";
import {
  inlineRuns,
  paragraphsOf,
  parseStandardEbooksChapter,
  parseWikisource,
  splitByWords,
  standardEbooksChapters,
} from "./classicsParse";

const modules = import.meta.glob("./**/*.ts");

describe("parsing open libraries", () => {
  test("paragraphs, italics, entities and <br> breaks", () => {
    expect(inlineRuns("&#8195;Bir <i>sisli</i> sabah&#160;")).toEqual([
      { type: "text", text: "Bir " },
      { type: "text", text: "sisli", marks: [{ type: "italic" }] },
      { type: "text", text: " sabah" },
    ]);
    expect(paragraphsOf("<p>Bir.<br/>İki.</p><p> </p><p>Üç.</p>").length).toBe(3);
  });

  test("a Vikikaynak page gives title, author, year and text", () => {
    const html = `<div id="headerContainer"><div><div><div><div><b><span id="header&#95;title&#95;text">Kaşağı</span></b>&#160;(1919)&#160;<br /><a><span id="header&#95;author&#95;text" class="vcard"><span class="fn">Ömer Seyfettin</span></span></a></div></div></div></div></div><p>Bu hikâyede…</p><div class="licenseContainer"><p>Lisans</p></div>`;
    const page = parseWikisource(html, "x");
    expect(page).toMatchObject({ title: "Kaşağı", author: "Ömer Seyfettin", year: "1919" });
    expect(page.paragraphs).toHaveLength(1);
  });

  test("long texts are cut at paragraph ends", () => {
    const para = (n: number) => ({ type: "paragraph" as const, content: [{ type: "text" as const, text: "söz ".repeat(n).trim() }] });
    const parts = splitByWords([para(1000), para(1000), para(1500), para(200)], 2000);
    expect(parts.map((p) => p.length)).toEqual([2, 2]);
  });

  test("Standard Ebooks: chapters from the contents, roman titles named", () => {
    expect(standardEbooksChapters(`<a href="text/titlepage.xhtml"/><a href="text/chapter-1.xhtml"/><a href="text/chapter-1.xhtml#x"/><a href="text/colophon.xhtml"/>`)).toEqual(["chapter-1.xhtml"]);
    const chapter = parseStandardEbooksChapter(`<html><head><title>IV</title></head><body><section><h2>IV</h2><p>“Hello,” <i>she</i> said.</p></section></body></html>`, "en");
    expect(chapter.title).toBe("Chapter IV");
    expect(chapter.paragraphs).toHaveLength(1);
  });
});

const doc = (...paras: string[]) =>
  JSON.stringify({ type: "doc", content: paras.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })) });

describe("splitting a chapter", () => {
  test("the tail becomes the next chapter and the rest follows it", async () => {
    const { t, authApi } = setupTest(modules);
    const owner = await signInAsNewUser(t, authApi);
    const other = await signInAsNewUser(t, authApi);
    const bookId = await owner.t.mutation(api.books.create, { title: "Uzun", visibility: "public" });
    const first = await owner.t.mutation(api.chapters.create, { bookId, title: "Hepsi", content: doc("Bir.", "İki."), status: "published" });
    const next = await owner.t.mutation(api.chapters.create, { bookId, parentChapterId: first, title: "Sonra", content: doc("Üç."), status: "published" });
    await expect(
      other.t.mutation(api.chapters.splitAt, { chapterId: first, head: doc("Bir."), tail: doc("İki."), tailTitle: "x" }),
    ).rejects.toThrow();
    const tail = await owner.t.mutation(api.chapters.splitAt, { chapterId: first, head: doc("Bir."), tail: doc("İki."), tailTitle: "Hepsi (2)" });
    const children = await owner.t.query(api.chapters.listChildren, { bookId, parentChapterId: first });
    expect(children.map((c) => c._id)).toEqual([tail]);
    const after = await owner.t.query(api.chapters.listChildren, { bookId, parentChapterId: tail });
    expect(after.map((c) => c._id)).toEqual([next]);
    expect((await owner.t.query(api.chapters.get, { chapterId: first }))?.content).not.toContain("İki");
  });
});

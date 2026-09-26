// Opt-in live smoke check. Uses the configured development deployment only.
// Creates one temporary sketch, then deletes it and closes the test session.
import { chromium } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";

process.loadEnvFile(".env.local");
if (!process.env.CONVEX_DEPLOYMENT?.startsWith("dev:")) throw new Error("Live smoke tests require a dev deployment.");
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
const ref = makeFunctionReference;
const password = process.env.LORE_TEST_PASSWORD || execSync("npx convex env get ADMIN_PASSWORD", { encoding: "utf8", windowsHide: true }).trim();
if (!password) throw new Error("Configure ADMIN_PASSWORD on the development deployment before testing.");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const base = process.env.LORE_TEST_URL || "http://localhost:3101";
let token, id, inviteId, readerToken, bookId;
mkdirSync("artifacts", { recursive: true });
try {
  await page.goto(base);
  await page.getByLabel("Sahip şifresi").waitFor();
  await page.screenshot({ path: "artifacts/desk-login.png", fullPage: true });
  await page.getByLabel("Sahip şifresi").fill(password);
  await page.getByRole("button", { name: "Yazı masamı aç" }).click();
  await page.getByRole("heading", { name: "Yazmaya devam." }).waitFor();
  token = await page.evaluate(() => localStorage.getItem("admin_token"));
  await page.screenshot({ path: "artifacts/desk-library.png", fullPage: true });
  await page.getByRole("button", { name: "Hemen yaz" }).click();
  await page.getByLabel("Belge başlığı").waitFor();
  const title = `Smoke ${Date.now()}`;
  await page.getByLabel("Belge başlığı").fill(title);
  await page.getByLabel("Belge metni").fill("Bir ilk cümle.\nİkinci satır burada kalmalı.");
  await page.getByRole("button", { name: "Şimdi kaydet" }).click();
  await page.getByRole("status").filter({ hasText: /^Kaydedildi$/ }).waitFor();
  const docs = await client.query(ref("notebook:list"), { accessToken: token });
  id = docs.find(d => d.title === title)?._id;
  assert.ok(id, "Autosave should persist the title");
  const doc = await client.query(ref("notebook:get"), { accessToken: token, id });
  assert.ok(doc.content.includes("İkinci satır"), "Autosave should preserve Turkish text");
  await page.screenshot({ path: "artifacts/desk-editor.png", fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Kaldığım yerden devam" }).click();
  await page.getByLabel("Belge başlığı").waitFor();
  assert.equal(await page.getByLabel("Belge başlığı").inputValue(), title);
  assert.ok((await page.getByLabel("Belge metni").innerText()).includes("İkinci satır"));
  await context.setOffline(true);
  await page.getByLabel("Belge metni").press("End");
  await page.getByLabel("Belge metni").pressSequentially(" Yerel kopya.");
  assert.ok((await page.evaluate(id => localStorage.getItem(`lore-recovery:${id}`), id)).includes("Yerel kopya"));
  await context.setOffline(false);
  await page.getByRole("status").filter({ hasText: /^Kaydedildi$/ }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/desk-mobile.png", fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, "Mobile layout should not overflow horizontally");
  // Exercise an actual invite in an isolated browser, without the owner session.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Davetler", exact: false }).click();
  await page.getByLabel("Davetli adı").fill(`Smoke reader ${Date.now()}`);
  await page.getByRole("button", { name: "Davet bağlantısı oluştur" }).click();
  await page.getByLabel("Davet bağlantısı").waitFor();
  const link = await page.getByLabel("Davet bağlantısı").inputValue();
  const invites = await client.query(ref("invitations:list"), { accessToken: token });
  inviteId = invites.find(i => i.name.startsWith("Smoke reader"))?._id;
  await client.mutation(ref("notebook:share"), { accessToken: token, id, shared: true });
  const readerContext = await browser.newContext();
  const readerPage = await readerContext.newPage();
  readerPage.on("pageerror", error => errors.push(error.message));
  await readerPage.goto(link);
  await readerPage.getByRole("button", { name: "Davetimi kabul et" }).click();
  await readerPage.getByRole("heading", { name: "Yazmaya devam." }).waitFor();
  readerToken = await readerPage.evaluate(() => localStorage.getItem("reader_token"));
  await readerPage.getByRole("button", { name: new RegExp(title) }).click();
  await readerPage.getByLabel("Belge başlığı").waitFor();
  assert.equal(await readerPage.getByLabel("Belge başlığı").getAttribute("readonly"), "");
  assert.equal(await readerPage.getByLabel("Belge metni").getAttribute("contenteditable"), "false");
  assert.equal(await readerPage.getByRole("button", { name: "Şimdi kaydet" }).count(), 0);
  await client.mutation(ref("invitations:revoke"), { accessToken: token, id: inviteId });
  await readerPage.getByLabel("Sahip şifresi").waitFor();
  await readerContext.close();
  await page.getByRole("button", { name: "Tüm yazılar", exact: false }).click();
  await page.getByRole("button", { name: "Yeni kitap", exact: false }).click();
  await page.getByLabel("Kitap başlığı").waitFor();
  const bookTitle = `Smoke book ${Date.now()}`;
  await page.getByLabel("Kitap başlığı").fill(bookTitle);
  await page.getByLabel("Belge başlığı").fill("Deneme bölümü");
  await page.getByLabel("Belge metni").fill("Kitabın ilk satırı.");
  await page.getByLabel("Belge metni").press("ControlOrMeta+a");
  await page.getByTitle("Kalın (Ctrl+B)").click();
  await page.getByLabel("Yazı tipi", { exact: true }).selectOption("Arial");
  await page.getByRole("button", { name: "Şimdi kaydet" }).click();
  await page.getByRole("status").filter({ hasText: /^Kaydedildi$/ }).waitFor();
  const books = await client.query(ref("books:list"), { accessToken: token });
  bookId = books.find(b => b.title === bookTitle)?._id;
  assert.ok(bookId, "New book title should persist");
  const chapters = await client.query(ref("chapters:listByBook"), { accessToken: token, bookId });
  assert.equal(chapters.length, 1, "New book should open with its first chapter ready");
  assert.ok(chapters[0].editorJson.includes('"bold"'), "Rich formatting should persist");
  assert.ok(chapters[0].editorJson.includes('Arial'), "Font selection should persist");
  await page.screenshot({ path: "artifacts/desk-book.png", fullPage: true });
  assert.deepEqual(errors, [], "Browser should have no uncaught runtime errors");
  console.log("Live smoke passed: login, library, create, autosave, offline recovery, reload, Turkish text, mobile layout, invite, read-only UI, revocation, book creation, rich chapter formatting.");
} finally {
  if (token) {
    if (bookId) { const chapters = await client.query(ref("chapters:listByBook"), { accessToken: token, bookId }); for (const chapter of chapters) await client.mutation(ref("chapters:remove"), { accessToken: token, sessionToken: token, id: chapter._id }); await client.mutation(ref("books:remove"), { accessToken: token, sessionToken: token, id: bookId }); }
    if (!id) { const docs = await client.query(ref("notebook:list"), { accessToken: token }); id = docs.find(d => d.title.startsWith("Smoke "))?._id; }
    if (id) await client.mutation(ref("notebook:remove"), { accessToken: token, id });
    if (readerToken) await client.mutation(ref("invitations:logout"), { token: readerToken });
    if (inviteId) { await client.mutation(ref("invitations:revoke"), { accessToken: token, id: inviteId }); await client.mutation(ref("invitations:remove"), { accessToken: token, id: inviteId }); }
    await client.action(ref("admin:logoutPublic"), { token });
  }
  await browser.close();
}

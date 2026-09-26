/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
async function setup() {
  const t = convexTest(schema, modules);
  await t.run(async ctx => { await ctx.db.insert("sessions", { token: "owner-test", expiresAt: Date.now() + 60000 }); });
  const accessToken = "owner-test";
  return { t, accessToken };
}
test("anonymous callers cannot read any legacy content or create writer requests", async () => {
  const { t } = await setup();
  await expect(t.query(api.books.list, {})).rejects.toThrow();
  await expect(t.query(api.chapters.list, {})).rejects.toThrow();
  await expect(t.query(api.universes.list, {})).rejects.toThrow();
  await expect(t.query(api.loreEntries.list, {})).rejects.toThrow();
  await expect(t.query(api.notebook.list, {})).rejects.toThrow();
  await expect(t.mutation(api.writerRequests.create, { name: "Uninvited", email: "test@example.com" })).rejects.toThrow();
});
test("invitations are single use, read only, and revocation invalidates existing sessions", async () => {
  const { t, accessToken } = await setup();
  const token = await t.mutation(api.invitations.create, { accessToken, name: "Reader" });
  const reader = await t.mutation(api.invitations.accept, { token });
  await expect(t.mutation(api.invitations.accept, { token })).rejects.toThrow();
  expect(await t.query(api.invitations.session, { token: reader })).toEqual({ role: "reader" });
  await expect(t.mutation(api.notebook.create, { accessToken: reader, kind: "poem" })).rejects.toThrow();
  await expect(t.mutation(api.notebook.createBook, { accessToken: reader })).rejects.toThrow();
  await expect(t.query(api.invitations.list, { accessToken: reader })).rejects.toThrow();
  const [invite] = await t.query(api.invitations.list, { accessToken });
  expect(invite).not.toHaveProperty("tokenHash");
  await t.mutation(api.invitations.revoke, { accessToken, id: invite._id });
  expect(await t.query(api.invitations.session, { token: reader })).toBeNull();
  await expect(t.query(api.books.list, { accessToken: reader })).rejects.toThrow();
});
test("sketches and poems stay private until explicitly shared", async () => {
  const { t, accessToken } = await setup();
  const id = await t.mutation(api.notebook.create, { accessToken, kind: "poem" });
  const token = await t.mutation(api.invitations.create, { accessToken, name: "Reader" });
  const reader = await t.mutation(api.invitations.accept, { token });
  expect(await t.query(api.notebook.list, { accessToken: reader })).toEqual([]);
  expect(await t.query(api.notebook.get, { accessToken: reader, id })).toBeNull();
  await t.mutation(api.notebook.share, { accessToken, id, shared: true });
  expect(await t.query(api.notebook.get, { accessToken: reader, id })).not.toBeNull();
  await t.mutation(api.notebook.share, { accessToken, id, shared: false });
  expect(await t.query(api.notebook.get, { accessToken: reader, id })).toBeNull();
});
test("stale autosaves cannot overwrite newer text", async () => {
  const { t, accessToken } = await setup();
  const id = await t.mutation(api.notebook.create, { accessToken, kind: "sketch" });
  expect(await t.mutation(api.notebook.save, { accessToken, id, title: "Draft", content: "new text", revision: 0 })).toBe(1);
  await expect(t.mutation(api.notebook.save, { accessToken, id, title: "Draft", content: "stale", revision: 0 })).rejects.toThrow();
  expect((await t.query(api.notebook.get, { accessToken, id }))?.content).toBe("new text");
});
test("books preserve existing chapter data and legacy edits invalidate rich text revisions", async () => {
  const { t, accessToken } = await setup();
  const bookId = await t.mutation(api.notebook.createBook, { accessToken });
  const id = await t.mutation(api.notebook.createChapter, { accessToken, bookId });
  await t.mutation(api.notebook.saveChapter, { accessToken, id, title: "Chapter", content: '{"type":"doc"}', plainText: "New words", revision: 0 });
  await t.mutation(api.chapters.update, { accessToken, sessionToken: accessToken, id, contentTr: "Legacy edit" });
  const chapter = await t.query(api.chapters.getById, { accessToken, id });
  expect(chapter?.revision).toBe(2);
  expect(chapter?.editorJson).toBeUndefined();
  expect(chapter?.contentTr).toBe("Legacy edit");
  await expect(t.mutation(api.notebook.saveChapter, { accessToken, id, title: "Old", content: "old", plainText: "old", revision: 1 })).rejects.toThrow();
});
test("expired sessions and invitations are rejected", async () => {
  const { t, accessToken } = await setup();
  const token = await t.mutation(api.invitations.create, { accessToken, name: "Reader" });
  await t.run(async ctx => { const invite = await ctx.db.query("invitations").first(); await ctx.db.patch(invite!._id, { expiresAt: 0 }); const session = await ctx.db.query("sessions").first(); await ctx.db.patch(session!._id, { expiresAt: 0 }); });
  await expect(t.mutation(api.invitations.accept, { token })).rejects.toThrow();
  await expect(t.query(api.books.list, { accessToken })).rejects.toThrow();
});

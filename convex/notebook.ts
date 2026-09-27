import { privateQuery, ownerMutation } from "./access";
import { v } from "convex/values";

const kind = v.union(v.literal("sketch"), v.literal("poem"), v.literal("journal"));
export const imageUrl = ownerMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => ctx.storage.getUrl(storageId),
});
export const list = privateQuery({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").withIndex("by_updatedAt").order("desc").take(500);
    return docs.filter(d => ctx.role === "owner" || d.shared).map(({ content, ...doc }) => doc);
  },
});
export const get = privateQuery({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id);
    if (doc && ctx.role !== "owner" && !doc.shared) return null;
    return doc;
  },
});
export const create = ownerMutation({
  args: { kind },
  handler: async (ctx, { kind }) => ctx.db.insert("documents", { kind, title: kind === "poem" ? "Adsız şiir" : kind === "journal" ? "Yeni günlük" : "Yeni eskiz", content: "", updatedAt: Date.now(), revision: 0, shared: false }),
});
export const save = ownerMutation({
  args: { id: v.id("documents"), title: v.string(), content: v.string(), revision: v.number() },
  handler: async (ctx, { id, revision, ...data }) => {
    const doc = await ctx.db.get(id);
    if (!doc || doc.revision !== revision) throw new Error("Başka bir sekmede değişti. Yerel kopyanızı indirin ve sayfayı yenileyin.");
    if (data.content.length > 500000 || data.title.length > 300) throw new Error("Belge çok uzun. Yeni bir belgeye devam edin.");
    await ctx.db.patch(id, { ...data, revision: revision + 1, updatedAt: Date.now() });
    return revision + 1;
  },
});
export const share = ownerMutation({
  args: { id: v.id("documents"), shared: v.boolean() },
  handler: async (ctx, { id, shared }) => ctx.db.patch(id, { shared }),
});
export const remove = ownerMutation({
  args: { id: v.id("documents") },
  handler: async (ctx, { id }) => ctx.db.delete(id),
});
export const createBook = ownerMutation({
  args: {},
  handler: async ctx => {
    const universe = await ctx.db.query("universes").first();
    const universeId = universe?._id ?? await ctx.db.insert("universes", { name: "Yazı evrenim" });
    const bookId = await ctx.db.insert("books", { universeId, title: "Adsız kitap" });
    await ctx.db.insert("chapters", { bookId, title: "Bölüm 1", contentTr: "", contentEn: "", order: 1, revision: 0 });
    return bookId;
  },
});
export const createChapter = ownerMutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    if (!await ctx.db.get(bookId)) throw new Error("Kitap bulunamadı.");
    const chapters = await ctx.db.query("chapters").withIndex("by_book", q => q.eq("bookId", bookId)).take(1000);
    return ctx.db.insert("chapters", { bookId, title: `Bölüm ${chapters.length + 1}`, contentTr: "", contentEn: "", order: Math.max(0, ...chapters.map(c => c.order)) + 1, revision: 0 });
  },
});
export const saveChapter = ownerMutation({
  args: { id: v.id("chapters"), title: v.string(), content: v.string(), plainText: v.string(), revision: v.number() },
  handler: async (ctx, { id, revision, title, content, plainText }) => {
    const doc = await ctx.db.get(id);
    if (!doc || (doc.revision ?? 0) !== revision) throw new Error("Bölüm başka bir sekmede değişti. Yerel kopyanızı indirin ve yenileyin.");
    if (content.length + plainText.length > 500000 || title.length > 300) throw new Error("Bölüm çok uzun.");
    await ctx.db.patch(id, { title, editorJson: content, contentTr: plainText, revision: revision + 1, updatedAt: Date.now() });
    return revision + 1;
  },
});

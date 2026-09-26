import { mutation, query } from "./_generated/server";
import { ownerMutation, access } from "./access";
import { v } from "convex/values";
import { generateSessionToken, hashPassword } from "./writerAuthLib";

export const session = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    try { return { role: await access(ctx, token) }; } catch { return null; }
  },
});
export const create = ownerMutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    if (!name.trim() || name.length > 100) throw new Error("Davet için bir ad girin.");
    const token = generateSessionToken();
    await ctx.db.insert("invitations", { name: name.trim(), tokenHash: await hashPassword(token), expiresAt: Date.now() + 7 * 86400000, revoked: false });
    return token;
  },
});
export const list = query({
  args: { accessToken: v.string() },
  handler: async (ctx, { accessToken }) => {
    if (await access(ctx, accessToken) !== "owner") throw new Error("Yetkisiz erişim.");
    return (await ctx.db.query("invitations").order("desc").take(100)).map(({ tokenHash, ...invite }) => invite);
  },
});
export const revoke = ownerMutation({
  args: { id: v.id("invitations") },
  handler: async (ctx, { id }) => { await ctx.db.patch(id, { revoked: true }); },
});
export const remove = ownerMutation({
  args: { id: v.id("invitations") },
  handler: async (ctx, { id }) => {
    const invite = await ctx.db.get(id);
    if (!invite?.revoked) throw new Error("Önce daveti iptal edin.");
    await ctx.db.delete(id);
  },
});
export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const hash = await hashPassword(token);
    const invite = await ctx.db.query("invitations").withIndex("by_tokenHash", q => q.eq("tokenHash", hash)).unique();
    if (!invite || invite.revoked || invite.usedAt || invite.expiresAt <= Date.now()) throw new Error("Davet kullanılmış, iptal edilmiş veya süresi dolmuş.");
    const session = generateSessionToken();
    await ctx.db.patch(invite._id, { usedAt: Date.now() });
    await ctx.db.insert("readerSessions", { tokenHash: await hashPassword(session), inviteId: invite._id, expiresAt: Date.now() + 30 * 86400000 });
    return session;
  },
});
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const hash = await hashPassword(token);
    const session = await ctx.db.query("readerSessions").withIndex("by_tokenHash", q => q.eq("tokenHash", hash)).unique();
    if (session) await ctx.db.delete(session._id);
  },
});

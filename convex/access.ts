import { customQuery, customMutation } from "convex-helpers/server/customFunctions";
import { query, mutation, internalQuery, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./writerAuthLib";

export async function access(ctx: QueryCtx, token?: string) {
  if (!token) throw new Error("Giriş gerekli.");
  const owner = await ctx.db.query("sessions").withIndex("by_token", q => q.eq("token", token)).unique();
  if (owner && owner.expiresAt > Date.now()) return "owner" as const;
  const hash = await hashPassword(token);
  const reader = await ctx.db.query("readerSessions").withIndex("by_tokenHash", q => q.eq("tokenHash", hash)).unique();
  if (reader && reader.expiresAt > Date.now()) {
    const invite = await ctx.db.get(reader.inviteId);
    if (invite && !invite.revoked) return "reader" as const;
  }
  throw new Error("Oturum sona erdi. Yeniden giriş yapın.");
}

export const privateQuery = customQuery(query, {
  args: { accessToken: v.optional(v.string()) },
  input: async (ctx, { accessToken }) => ({ ctx: { role: await access(ctx, accessToken) }, args: {} }),
});
export const ownerMutation = customMutation(mutation, {
  args: { accessToken: v.optional(v.string()) },
  input: async (ctx, { accessToken }) => {
    if (await access(ctx, accessToken) !== "owner") throw new Error("Yalnızca sahibi düzenleyebilir.");
    return { ctx: {}, args: {} };
  },
});

/** For actions, which can't touch ctx.db directly — call via ctx.runQuery before doing anything privileged. */
export const checkOwner = internalQuery({
  args: { accessToken: v.optional(v.string()) },
  handler: async (ctx, { accessToken }) => {
    if (await access(ctx, accessToken) !== "owner") throw new Error("Yalnızca sahibi düzenleyebilir.");
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateSessionToken, hashPassword } from "./writerAuthLib";

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const requests = await ctx.db.query("writerRequests").collect();
    const request = requests.find(
      (r) => r.email.trim().toLowerCase() === email && r.status === "approved"
    );
    if (!request || !request.passwordHash) {
      throw new Error("Geçersiz e-posta veya parola.");
    }

    const passwordHash = await hashPassword(args.password);
    if (passwordHash !== request.passwordHash) {
      throw new Error("Geçersiz e-posta veya parola.");
    }

    const token = generateSessionToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await ctx.db.insert("writerSessions", {
      token,
      writerRequestId: request._id,
      expiresAt,
    });

    return { token };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("writerSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const verifyWriterSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const session = await ctx.db
      .query("writerSessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;

    const request = await ctx.db.get(session.writerRequestId);
    if (!request) return null;

    return { name: request.name, email: request.email };
  },
});

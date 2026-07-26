import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple email regex validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifySession(ctx: { db: any }, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
}

export const listByTarget = query({
  args: {
    targetId: v.union(v.id("loreEntries"), v.id("chapters")),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) => q.eq("targetId", args.targetId))
      .collect();
    // Return comments sorted by creation date descending
    return comments.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const add = mutation({
  args: {
    targetId: v.union(v.id("loreEntries"), v.id("chapters")),
    name: v.string(),
    email: v.string(),
    content: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validation
    const name = args.name.trim();
    const email = args.email.trim();
    const content = args.content.trim();

    if (!name || name.length < 2 || name.length > 50) {
      throw new Error("İsim en az 2, en fazla 50 karakter olmalıdır.");
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new Error("Lütfen geçerli bir e-posta adresi girin.");
    }
    if (!content || content.length < 3 || content.length > 1000) {
      throw new Error("Yorum en az 3, en fazla 1000 karakter olmalıdır.");
    }
    if (!args.clientId || args.clientId.trim() === "") {
      throw new Error("Geçersiz istemci kimliği.");
    }

    // 2. Cooldown check (15 seconds)
    const cooldownPeriod = 15000; // 15 seconds
    const cutoffTime = Date.now() - cooldownPeriod;

    // Get recent comments on this target to check for spam
    const recentComments = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) => q.eq("targetId", args.targetId))
      .filter((q) => q.gt(q.field("createdAt"), cutoffTime))
      .collect();

    const isSpamming = recentComments.some(
      (c) => c.email === email || c.clientId === args.clientId
    );

    if (isSpamming) {
      throw new Error("Lütfen yeni bir yorum yazmadan önce 15 saniye bekleyin.");
    }

    // 3. Insert comment
    return await ctx.db.insert("comments", {
      targetId: args.targetId,
      name,
      email,
      content,
      createdAt: Date.now(),
      clientId: args.clientId,
    });
  },
});

export const listAll = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const comments = await ctx.db.query("comments").collect();
    const withTarget = await Promise.all(
      comments.map(async (c) => {
        const target: any = await ctx.db.get(c.targetId);
        const targetLabel = target ? target.name ?? target.title ?? null : null;
        const targetType = target
          ? "name" in target
            ? "lore"
            : "chapter"
          : null;
        return { ...c, targetLabel, targetType };
      })
    );
    return withTarget.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const remove = mutation({
  args: { id: v.id("comments"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateWriterPassword, hashPassword } from "./writerAuthLib";

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

export const list = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const requests = await ctx.db.query("writerRequests").collect();
    // Return requests sorted by creation date descending
    return requests.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim();
    const message = args.message?.trim() || "";

    if (!name || name.length < 2 || name.length > 50) {
      throw new Error("İsim en az 2, en fazla 50 karakter olmalıdır.");
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      throw new Error("Lütfen geçerli bir e-posta adresi girin.");
    }
    if (message && message.length > 1000) {
      throw new Error("Mesaj en fazla 1000 karakter olmalıdır.");
    }

    // Cooldown: prevent same email from sending multiple requests in 2 minutes
    const cooldownPeriod = 120000; // 2 minutes
    const cutoffTime = Date.now() - cooldownPeriod;
    
    const recentRequest = await ctx.db
      .query("writerRequests")
      .filter((q) => q.gt(q.field("createdAt"), cutoffTime))
      .collect();

    const isSpamming = recentRequest.some((r) => r.email === email);
    if (isSpamming) {
      throw new Error("Lütfen yeni bir başvuru yapmadan önce 2 dakika bekleyin.");
    }

    return await ctx.db.insert("writerRequests", {
      name,
      email,
      message,
      createdAt: Date.now(),
      status: "pending",
    });
  },
});

export const approve = mutation({
  args: { id: v.id("writerRequests"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Request not found");

    const password = generateWriterPassword();
    const passwordHash = await hashPassword(password);
    await ctx.db.patch(args.id, { status: "approved", passwordHash });

    return { password };
  },
});

export const reject = mutation({
  args: { id: v.id("writerRequests"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.patch(args.id, { status: "rejected" });
  },
});

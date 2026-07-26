import { mutation } from "./_generated/server";
import { v } from "convex/values";

async function verifySession(ctx: { db: any }, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
}

async function verifyWriterToken(ctx: { db: any }, token: string) {
  const session = await ctx.db
    .query("writerSessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
}

export const generateUploadUrl = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    writerToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken) {
      await verifySession(ctx, args.sessionToken);
    } else if (args.writerToken) {
      await verifyWriterToken(ctx, args.writerToken);
    } else {
      throw new Error("Unauthorized");
    }
    return ctx.storage.generateUploadUrl();
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.storage.delete(args.storageId);
  },
});

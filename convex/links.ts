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

const ENTITY_TYPE = v.union(
  v.literal("chapter"),
  v.literal("character"),
  v.literal("location"),
  v.literal("lore"),
  v.literal("faction")
);

export const create = mutation({
  args: {
    sourceId: v.string(),
    sourceType: ENTITY_TYPE,
    targetId: v.string(),
    targetType: ENTITY_TYPE,
    linkType: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    const { sessionToken, ...data } = args;
    return ctx.db.insert("links", data);
  },
});

export const remove = mutation({
  args: { id: v.id("links"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    await verifySession(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const checkLiked = query({
  args: {
    targetId: v.union(v.id("loreEntries"), v.id("chapters")),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_target_and_client", (q) =>
        q.eq("targetId", args.targetId).eq("clientId", args.clientId)
      )
      .first();
    return !!existing;
  },
});

export const toggle = mutation({
  args: {
    targetId: v.union(v.id("loreEntries"), v.id("chapters")),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.clientId || args.clientId.trim() === "") {
      throw new Error("Invalid client ID");
    }

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_target_and_client", (q) =>
        q.eq("targetId", args.targetId).eq("clientId", args.clientId)
      )
      .first();

    const isLore = args.targetId.split(":")[0] === "loreEntries";
    const targetTable = isLore ? "loreEntries" : "chapters";

    const target = await ctx.db.get(args.targetId as any);
    if (!target) {
      throw new Error("Target not found");
    }

    if (existing) {
      // Unlike
      await ctx.db.delete(existing._id);
      const newCount = Math.max(0, (target.likeCount ?? 0) - 1);
      await ctx.db.patch(args.targetId as any, { likeCount: newCount });
      return false;
    } else {
      // Like
      await ctx.db.insert("likes", {
        targetId: args.targetId,
        clientId: args.clientId,
      });
      const newCount = (target.likeCount ?? 0) + 1;
      await ctx.db.patch(args.targetId as any, { likeCount: newCount });
      return true;
    }
  },
});

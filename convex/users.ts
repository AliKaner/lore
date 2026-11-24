import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

export const createUser = internalMutation({
  args: {
    method: v.object({
      name: v.literal("usernamePasskey"),
      profile: v.object({}),
    }),
  },
  returns: v.id("users"),
  handler: async (ctx) => {
    return await ctx.db.insert("users", { xp: 0, level: 1 });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const username: string | null = await ctx.runQuery(
      components.authUsername.public.getUsername,
      { userId },
    );
    return { ...user, username };
  },
});

export const publicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const username: string | null = await ctx.runQuery(
      components.authUsername.public.getUsername,
      { userId: args.userId },
    );
    return { ...user, username };
  },
});

export const updateProfile = mutation({
  args: { bio: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapmalısın.");
    await ctx.db.patch(userId, { bio: args.bio });
    return null;
  },
});

export function levelForXp(xp: number): number {
  return 1 + Math.floor(xp / 100);
}

export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Giriş yapmalısın.");
  return userId;
}

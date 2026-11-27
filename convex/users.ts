import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { themeValidator } from "./themes";

export const createUser = internalMutation({
  args: {
    method: v.object({
      name: v.literal("usernamePassword"),
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
    if (!user || user.deletedAt !== undefined) return null;
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
    if (!user || user.deletedAt !== undefined) return null;
    const username: string | null = await ctx.runQuery(
      components.authUsername.public.getUsername,
      { userId: args.userId },
    );
    return { ...user, username };
  },
});

export const setTheme = mutation({
  args: { theme: themeValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapmalısın.");
    await ctx.db.patch(userId, { theme: args.theme });
    return null;
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

// Deletes the signed-in account. The password and the username, typed
// again, confirm it. Everything the person made goes (their writings,
// world, comments, likes); a chapter of theirs that someone else continued
// stays, with no name on it, so the other writer's work isn't cut loose.
export const deleteAccount = mutation({
  args: { password: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    if (!user || user.deletedAt !== undefined) throw new Error("Hesap bulunamadı.");
    const username: string | null = await ctx.runQuery(components.authUsername.public.getUsername, { userId });
    if (!username || args.username.trim().replace(/^@/, "").toLocaleLowerCase("tr-TR") !== username.toLocaleLowerCase("tr-TR")) {
      throw new Error("Kullanıcı adın eşleşmiyor.");
    }
    // A wrong password is returned, not thrown, so the attempt still counts
    // against the password component's rate limit.
    const check = await ctx.runMutation(components.authPassword.public.verifyPassword, { userId, password: args.password });
    if (!check.success) return { error: "Şifren yanlış." };
    await eraseAccount(ctx, userId);
    return { error: null };
  },
});

async function eraseAccount(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return;
  for (const id of [user.avatarStorageId, user.wallpaperStorageId]) if (id) await ctx.storage.delete(id);
  await ctx.db.replace(userId, { xp: 0, level: 1, deletedAt: Date.now() });
  await ctx.runMutation(components.authUsername.public.deleteUsername, { userId });
  const sessions = await ctx.runQuery(components.auth.public.listSessions, { userId });
  if (sessions.length > 0) {
    await ctx.runMutation(components.auth.public.revokeSessions, { sessionIds: sessions.map((s) => s.sessionId) });
  }
  await ctx.scheduler.runAfter(0, internal.cleanup.purgeUser, { userId, chapterCursor: null });
}

// The same, once the person is known to have asked for it.
export const erase = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await eraseAccount(ctx, args.userId);
    return null;
  },
});

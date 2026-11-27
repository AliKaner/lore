import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireUserId } from "./users";
import { canViewChapter } from "./access";

// Daily writing (words) and reading (minutes) goals. What a writer does each
// day is summed in `dailyActivity`, keyed by their own calendar day.

export const LIMITS = {
  writing: { min: 50, max: 20_000 },
  reading: { min: 5, max: 600 },
};

// Turkey, for anyone whose device hasn't told us yet.
const DEFAULT_OFFSET = 180;

export function dayKey(now: number, offsetMinutes: number) {
  return new Date(now + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

export function previousDay(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

// Days in a row the goal was met, counting back from today — or from
// yesterday while today is still in progress.
export function streak(met: (day: string) => boolean, today: string) {
  let day = met(today) ? today : previousDay(today);
  let count = 0;
  while (met(day) && count < 3650) {
    count += 1;
    day = previousDay(day);
  }
  return count;
}

async function todayRow(ctx: MutationCtx, userId: Id<"users">, now: number) {
  const user = await ctx.db.get(userId);
  const day = dayKey(now, user?.tzOffset ?? DEFAULT_OFFSET);
  const row = await ctx.db
    .query("dailyActivity")
    .withIndex("by_user_and_day", (q) => q.eq("userId", userId).eq("day", day))
    .unique();
  if (row) return row;
  const id = await ctx.db.insert("dailyActivity", { userId, day, wordsWritten: 0, secondsRead: 0 });
  return (await ctx.db.get(id))!;
}

// Called by chapters.create/update with how many words the text gained (or
// lost, when the writer cuts). Counts for whoever wrote the chapter.
export async function recordWriting(ctx: MutationCtx, authorId: Id<"users">, words: number) {
  if (words === 0) return;
  const now = Date.now();
  const row = await todayRow(ctx, authorId, now);
  const patch: { wordsWritten: number; hours?: number[] } = { wordsWritten: row.wordsWritten + words };
  if (words > 0) {
    const user = await ctx.db.get(authorId);
    const hour = new Date(now + (user?.tzOffset ?? DEFAULT_OFFSET) * 60_000).getUTCHours();
    const hours = row.hours?.length === 24 ? [...row.hours] : new Array<number>(24).fill(0);
    hours[hour] += words;
    patch.hours = hours;
  }
  await ctx.db.patch(row._id, patch);
}

/* ---------- Reading ---------- */

const HEARTBEAT_SECONDS = 30;

// The reading page sends this every half minute while the reader is on the
// page and active. Pings that come too close together (two open tabs) are
// dropped.
export const logReading = mutation({
  args: { chapterId: v.id("chapters"), seconds: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter || !(await canViewChapter(ctx, chapter, userId))) {
      throw new Error("Bölüm bulunamadı.");
    }
    const seconds = Math.round(Math.min(Math.max(args.seconds, 0), HEARTBEAT_SECONDS * 2));
    if (seconds === 0) return null;
    const now = Date.now();
    const row = await todayRow(ctx, userId, now);
    if (row.lastReadAt !== undefined && now - row.lastReadAt < seconds * 600) return null;
    await ctx.db.patch(row._id, { secondsRead: row.secondsRead + seconds, lastReadAt: now });
    return null;
  },
});

/* ---------- Goals ---------- */

const goalArg = v.union(v.number(), v.null());

export const setGoals = mutation({
  args: { writingGoal: v.optional(goalArg), readingGoal: v.optional(goalArg) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const patch: Partial<Doc<"users">> = {};
    const check = (value: number, { min, max }: { min: number; max: number }) => {
      if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error("Bu hedef izin verilen aralığın dışında.");
      }
      return value;
    };
    if (args.writingGoal !== undefined) {
      patch.writingGoal = args.writingGoal === null ? undefined : check(args.writingGoal, LIMITS.writing);
    }
    if (args.readingGoal !== undefined) {
      patch.readingGoal = args.readingGoal === null ? undefined : check(args.readingGoal, LIMITS.reading);
    }
    await ctx.db.patch(userId, patch);
    return null;
  },
});

// The device's offset from UTC in minutes, so "today" is the writer's today.
export const setTimezone = mutation({
  args: { offset: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!Number.isInteger(args.offset) || Math.abs(args.offset) > 14 * 60) {
      throw new Error("Geçersiz saat dilimi.");
    }
    await ctx.db.patch(userId, { tzOffset: args.offset });
    return null;
  },
});

// Today, the last seven days and the streaks. `today` is the client's own
// calendar day, so the page turns over at the writer's midnight.
// A year of writing, day by day (for the heatmap), and by hour of day.
export const activity = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(args.today)) throw new Error("Geçersiz gün.");
    const rows = await ctx.db
      .query("dailyActivity")
      .withIndex("by_user_and_day", (q) => q.eq("userId", userId).lte("day", args.today))
      .order("desc")
      .take(372);
    const hours = new Array<number>(24).fill(0);
    for (const row of rows) row.hours?.forEach((n, i) => (hours[i] += Math.max(0, n)));
    return {
      days: rows.map((row) => ({ day: row.day, words: Math.max(0, row.wordsWritten), minutes: Math.floor(row.secondsRead / 60) })),
      hours,
    };
  },
});

export const summary = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(args.today)) throw new Error("Geçersiz gün.");

    const rows = await ctx.db
      .query("dailyActivity")
      .withIndex("by_user_and_day", (q) => q.eq("userId", userId).lte("day", args.today))
      .order("desc")
      .take(400);
    const byDay = new Map(rows.map((row) => [row.day, row]));
    const wordsOn = (day: string) => Math.max(0, byDay.get(day)?.wordsWritten ?? 0);
    const minutesOn = (day: string) => Math.floor((byDay.get(day)?.secondsRead ?? 0) / 60);

    const week: { day: string; words: number; minutes: number }[] = [];
    let day = args.today;
    for (let i = 0; i < 7; i++) {
      week.unshift({ day, words: wordsOn(day), minutes: minutesOn(day) });
      day = previousDay(day);
    }

    const writingGoal = user.writingGoal ?? null;
    const readingGoal = user.readingGoal ?? null;
    return {
      writingGoal,
      readingGoal,
      today: { words: wordsOn(args.today), minutes: minutesOn(args.today) },
      week,
      writingStreak: writingGoal ? streak((d) => wordsOn(d) >= writingGoal, args.today) : 0,
      readingStreak: readingGoal ? streak((d) => minutesOn(d) >= readingGoal, args.today) : 0,
    };
  },
});

/// <reference types="vite/client" />
import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";
import { previousDay, streak } from "./goals";

const modules = import.meta.glob("./**/*.ts");

const doc = (text: string) =>
  JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
const words = (n: number) => Array.from({ length: n }, () => "söz").join(" ");

afterEach(() => {
  vi.useRealTimers();
});

describe("goal helpers", () => {
  test("days step back across months and years", () => {
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
    expect(previousDay("2026-01-01")).toBe("2025-12-31");
  });

  test("a streak counts back from today, or from yesterday while today is unfinished", () => {
    const done = new Set(["2026-11-24", "2026-11-25"]);
    expect(streak((d) => done.has(d), "2026-11-26")).toBe(2);
    done.add("2026-11-26");
    expect(streak((d) => done.has(d), "2026-11-26")).toBe(3);
    expect(streak((d) => done.has(d), "2026-11-28")).toBe(0);
  });
});

describe("goals", () => {
  test("words written today come from the writer's saves, net of cuts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-26T09:00:00Z"));
    const { t, authApi } = setupTest(modules);
    const { t: asWriter } = await signInAsNewUser(t, authApi);
    await asWriter.mutation(api.goals.setTimezone, { offset: 180 });
    await asWriter.mutation(api.goals.setGoals, { writingGoal: 100 });
    const bookId = await asWriter.mutation(api.books.create, { title: "Kitap", visibility: "private" });
    const chapterId = await asWriter.mutation(api.chapters.create, {
      bookId,
      title: "Bir",
      content: doc(words(80)),
      status: "draft",
    });
    await asWriter.mutation(api.chapters.update, { chapterId, content: doc(words(130)) });
    await asWriter.mutation(api.chapters.update, { chapterId, content: doc(words(120)) });

    const summary = await asWriter.query(api.goals.summary, { today: "2026-11-26" });
    expect(summary?.today.words).toBe(120);
    expect(summary?.writingStreak).toBe(1);
    expect(summary?.week).toHaveLength(7);
    expect(summary?.week[6]).toEqual({ day: "2026-11-26", words: 120, minutes: 0 });
  });

  test("the writer's day follows their time zone", async () => {
    vi.useFakeTimers();
    // 22:30 UTC is already the next day in Istanbul.
    vi.setSystemTime(new Date("2026-11-26T22:30:00Z"));
    const { t, authApi } = setupTest(modules);
    const { t: asWriter } = await signInAsNewUser(t, authApi);
    await asWriter.mutation(api.goals.setTimezone, { offset: 180 });
    const bookId = await asWriter.mutation(api.books.create, { title: "Kitap", visibility: "private" });
    await asWriter.mutation(api.chapters.create, { bookId, title: "Gece", content: doc(words(10)), status: "draft" });
    const summary = await asWriter.query(api.goals.summary, { today: "2026-11-27" });
    expect(summary?.today.words).toBe(10);
  });

  test("reading time adds up from heartbeats, and doubled pings are dropped", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-26T09:00:00Z"));
    const { t, authApi } = setupTest(modules);
    const { t: asWriter } = await signInAsNewUser(t, authApi);
    const bookId = await asWriter.mutation(api.books.create, { title: "Kitap", visibility: "public" });
    const chapterId = await asWriter.mutation(api.chapters.create, {
      bookId,
      title: "Bir",
      content: doc(words(5)),
      status: "published",
    });
    const { t: asReader } = await signInAsNewUser(t, authApi);
    await asReader.mutation(api.goals.setGoals, { readingGoal: 5 });
    for (let i = 0; i < 12; i++) {
      await asReader.mutation(api.goals.logReading, { chapterId, seconds: 30 });
      // A second tab pinging at the same moment.
      await asReader.mutation(api.goals.logReading, { chapterId, seconds: 30 });
      vi.advanceTimersByTime(30_000);
    }
    const summary = await asReader.query(api.goals.summary, { today: "2026-11-26" });
    expect(summary?.today.minutes).toBe(6);
    expect(summary?.readingStreak).toBe(1);
  });

  test("reading a private writing doesn't count, and goals stay in range", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asWriter } = await signInAsNewUser(t, authApi);
    const bookId = await asWriter.mutation(api.books.create, { title: "Günlük", visibility: "private" });
    const chapterId = await asWriter.mutation(api.chapters.create, {
      bookId,
      title: "Bir",
      content: doc("gizli"),
      status: "published",
    });
    const { t: asStranger } = await signInAsNewUser(t, authApi);
    await expect(asStranger.mutation(api.goals.logReading, { chapterId, seconds: 30 })).rejects.toThrow();
    await expect(asStranger.mutation(api.goals.setGoals, { writingGoal: 5 })).rejects.toThrow();
    await expect(asStranger.mutation(api.goals.setGoals, { readingGoal: 10.5 })).rejects.toThrow();
    await asStranger.mutation(api.goals.setGoals, { readingGoal: 20 });
    await asStranger.mutation(api.goals.setGoals, { readingGoal: null });
    expect(await t.query(api.goals.summary, { today: "2026-11-26" })).toBeNull();
  });
});

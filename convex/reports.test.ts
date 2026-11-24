/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

describe("reports", () => {
  test("a report on a chapter shows up for that chapter's book owner only", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const { t: asOtherOwner } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Kitap",
      visibility: "public",
    });
    const chapterId = await asOwner.mutation(api.chapters.create, {
      bookId,
      title: "Bölüm",
      content: "{}",
      status: "published",
    });

    const { t: asReporter } = await signInAsNewUser(t, authApi);
    await asReporter.mutation(api.reports.create, {
      targetType: "chapter",
      targetId: chapterId,
      reason: "Uygunsuz içerik",
    });

    const ownerReports = await asOwner.query(api.reports.listForMyBooks);
    expect(ownerReports).toHaveLength(1);
    expect(ownerReports[0]?.targetId).toBe(chapterId);

    const otherOwnerReports = await asOtherOwner.query(api.reports.listForMyBooks);
    expect(otherOwnerReports).toHaveLength(0);
  });

  test("an empty reason is rejected", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Kitap",
      visibility: "public",
    });

    await expect(
      asOwner.mutation(api.reports.create, {
        targetType: "book",
        targetId: bookId,
        reason: "",
      }),
    ).rejects.toThrow();
  });

  test("resolving a report removes it from the open list, and only the owner can resolve it", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Kitap",
      visibility: "public",
    });

    const reportId = await asStranger.mutation(api.reports.create, {
      targetType: "book",
      targetId: bookId,
      reason: "Telif ihlali",
    });

    await expect(
      asStranger.mutation(api.reports.resolve, { reportId }),
    ).rejects.toThrow();

    await asOwner.mutation(api.reports.resolve, { reportId });
    const openReports = await asOwner.query(api.reports.listForMyBooks);
    expect(openReports).toHaveLength(0);
  });
});

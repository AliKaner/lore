/// <reference types="vite/client" />
import { describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

async function writer() {
  const { t, authApi } = setupTest(modules);
  const { t: asOwner } = await signInAsNewUser(t, authApi);
  const bookId = await asOwner.mutation(api.books.create, { title: "Kuzey", visibility: "public" });
  return { t, authApi, asOwner, bookId };
}

describe("side boards", () => {
  test("cards keep their board and order, and move between boards", async () => {
    const { asOwner, bookId } = await writer();
    const note = await asOwner.mutation(api.boards.add, { bookId, side: "left", kind: "note" });
    const plan = await asOwner.mutation(api.boards.add, { bookId, side: "left", kind: "checklist" });
    await asOwner.mutation(api.boards.update, { itemId: note, text: "Selin denizden korkar." });
    await asOwner.mutation(api.boards.update, {
      itemId: plan,
      title: "Bu bölüm",
      items: [{ text: "Çan sahnesi", done: false }],
    });
    await asOwner.mutation(api.boards.move, { itemId: plan, to: "up" });
    let board = await asOwner.query(api.boards.list, { bookId });
    expect(board.map((c) => c._id)).toEqual([plan, note]);
    expect(board[1].text).toBe("Selin denizden korkar.");

    await asOwner.mutation(api.boards.move, { itemId: note, to: "right" });
    board = await asOwner.query(api.boards.list, { bookId });
    expect(board.find((c) => c._id === note)?.side).toBe("right");
  });

  test("a pinned entity shows its card; only your own entities can be pinned", async () => {
    const { t, authApi, asOwner, bookId } = await writer();
    const selin = await asOwner.mutation(api.entities.create, { kind: "character", name: "Selin", bookId });
    await asOwner.mutation(api.entities.update, { entityId: selin, fields: { age: "24", role: "Harita ustası" } });
    await asOwner.mutation(api.boards.add, { bookId, side: "right", kind: "entity", entityId: selin });
    const [card] = await asOwner.query(api.boards.list, { bookId });
    expect(card.entity?.name).toBe("Selin");
    expect(card.entity?.facts).toEqual([
      { label: "Yaşı", value: "24" },
      { label: "Mesleği / rolü", value: "Harita ustası" },
    ]);

    const { t: asStranger } = await signInAsNewUser(t, authApi);
    await expect(
      asStranger.mutation(api.boards.add, { bookId, side: "left", kind: "entity", entityId: selin }),
    ).rejects.toThrow();
    // Boards are private: a reader of the same writing has an empty board.
    expect(await asStranger.query(api.boards.list, { bookId })).toEqual([]);
    await expect(asStranger.mutation(api.boards.remove, { itemId: card._id })).rejects.toThrow();
  });

  test("deleting the writing or the pinned entity clears the cards", async () => {
    vi.useFakeTimers();
    try {
      const { t, asOwner, bookId } = await writer();
      const selin = await asOwner.mutation(api.entities.create, { kind: "character", name: "Selin" });
      await asOwner.mutation(api.boards.add, { bookId, side: "right", kind: "entity", entityId: selin });
      await asOwner.mutation(api.boards.add, { bookId, side: "left", kind: "note" });
      await asOwner.mutation(api.entities.remove, { entityId: selin });
      await t.finishAllScheduledFunctions(vi.runAllTimers);
      expect((await asOwner.query(api.boards.list, { bookId })).map((c) => c.kind)).toEqual(["note"]);

      await asOwner.mutation(api.books.remove, { bookId });
      await t.finishAllScheduledFunctions(vi.runAllTimers);
      expect(await t.run(async (ctx) => ctx.db.query("boardItems").collect())).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});

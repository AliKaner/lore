/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

describe("characters", () => {
  test("creating a character requires sign-in", async () => {
    const { t } = setupTest(modules);
    await expect(
      t.mutation(api.characters.create, { name: "Kahraman" }),
    ).rejects.toThrow();
  });

  test("creating with an originBookId auto-attaches it to that book", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Kitap",
      visibility: "public",
    });

    const characterId = await asOwner.mutation(api.characters.create, {
      name: "Elif",
      originBookId: bookId,
    });

    const characters = await t.query(api.characters.listForBook, { bookId });
    expect(characters.map((c) => c._id)).toContain(characterId);
  });

  test("a character can be attached to a second book, by that book's owner", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const characterId = await asOwner.mutation(api.characters.create, {
      name: "Elif",
    });
    const secondBookId = await asOwner.mutation(api.books.create, {
      title: "İkinci Kitap",
      visibility: "public",
    });

    await asOwner.mutation(api.characters.attachToBook, {
      bookId: secondBookId,
      characterId,
    });
    const characters = await t.query(api.characters.listForBook, {
      bookId: secondBookId,
    });
    expect(characters.map((c) => c._id)).toContain(characterId);
  });

  test("attaching the same character twice does not duplicate it", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const characterId = await asOwner.mutation(api.characters.create, {
      name: "Elif",
    });
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Kitap",
      visibility: "public",
    });

    await asOwner.mutation(api.characters.attachToBook, { bookId, characterId });
    await asOwner.mutation(api.characters.attachToBook, { bookId, characterId });

    const characters = await t.query(api.characters.listForBook, { bookId });
    expect(characters.filter((c) => c._id === characterId)).toHaveLength(1);
  });

  test("only the book's owner can attach a character to it", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);
    const characterId = await asStranger.mutation(api.characters.create, {
      name: "Yabancının karakteri",
    });
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Kitap",
      visibility: "public",
    });

    await expect(
      asStranger.mutation(api.characters.attachToBook, { bookId, characterId }),
    ).rejects.toThrow();
  });

  test("only the creator can update a character", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);
    const characterId = await asOwner.mutation(api.characters.create, {
      name: "Elif",
    });

    await expect(
      asStranger.mutation(api.characters.update, {
        characterId,
        name: "Çalıntı isim",
      }),
    ).rejects.toThrow();

    await asOwner.mutation(api.characters.update, { characterId, name: "Elif Han" });
    const character = await t.query(api.characters.get, { characterId });
    expect(character?.name).toBe("Elif Han");
  });
});

describe("places", () => {
  test("creating with an originBookId auto-attaches it, and only the book owner can attach further", async () => {
    const { t, authApi } = setupTest(modules);
    const { t: asOwner } = await signInAsNewUser(t, authApi);
    const { t: asStranger } = await signInAsNewUser(t, authApi);
    const bookId = await asOwner.mutation(api.books.create, {
      title: "Kitap",
      visibility: "public",
    });

    const placeId = await asOwner.mutation(api.places.create, {
      name: "Kale",
      originBookId: bookId,
    });
    const places = await t.query(api.places.listForBook, { bookId });
    expect(places.map((p) => p._id)).toContain(placeId);

    await expect(
      asStranger.mutation(api.places.attachToBook, { bookId, placeId }),
    ).rejects.toThrow();
  });
});

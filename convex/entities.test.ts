/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { setupTest, signInAsNewUser } from "./testUtils.test";

const modules = import.meta.glob("./**/*.ts");

async function writer() {
  const { t, authApi } = setupTest(modules);
  const { t: asOwner } = await signInAsNewUser(t, authApi);
  const bookId = await asOwner.mutation(api.books.create, { title: "Kuzey", visibility: "public" });
  const make = (kind: "character" | "country" | "race" | "place" | "weapon", name: string, inBook = true) =>
    asOwner.mutation(api.entities.create, { kind, name, ...(inBook ? { bookId } : {}) });
  return { t, authApi, asOwner, bookId, make };
}

describe("entities", () => {
  test("creating needs an account", async () => {
    const { t } = setupTest(modules);
    await expect(t.mutation(api.entities.create, { kind: "character", name: "Elif" })).rejects.toThrow();
  });

  test("a character keeps its kind's fields and drops unknown ones", async () => {
    const { asOwner, make } = await writer();
    const id = await make("character", "  Selin   Aras ");
    await asOwner.mutation(api.entities.update, {
      entityId: id,
      fields: { age: "24", height: "1,70 m", eyes: "Ela" },
      custom: [{ label: "Sevdiği yemek", value: "Balık" }],
    });
    await asOwner.mutation(api.entities.update, { entityId: id, fields: { eyes: "" } });
    const selin = await asOwner.query(api.entities.get, { entityId: id });
    expect(selin?.name).toBe("Selin Aras");
    expect(selin?.fields).toEqual({ age: "24", height: "1,70 m" });
    expect(selin?.custom).toEqual([{ label: "Sevdiği yemek", value: "Balık" }]);

    // A country's field is not a character's.
    await expect(
      asOwner.mutation(api.entities.update, { entityId: id, fields: { government: "Krallık" } }),
    ).rejects.toThrow();
  });

  test("links check the field, the kind and how many", async () => {
    const { asOwner, make } = await writer();
    const selin = await make("character", "Selin");
    const aras = await make("character", "Aras");
    const deniz = await make("character", "Deniz");
    const kuzey = await make("country", "Kuzey Krallığı");

    await asOwner.mutation(api.entities.setLinks, { entityId: selin, role: "father", toIds: [aras] });
    await asOwner.mutation(api.entities.setLinks, { entityId: selin, role: "country", toIds: [kuzey] });
    // A country cannot be a father, and there is only one father.
    await expect(
      asOwner.mutation(api.entities.setLinks, { entityId: selin, role: "father", toIds: [kuzey] }),
    ).rejects.toThrow();
    await expect(
      asOwner.mutation(api.entities.setLinks, { entityId: selin, role: "father", toIds: [aras, deniz] }),
    ).rejects.toThrow();
    await expect(
      asOwner.mutation(api.entities.setLinks, { entityId: selin, role: "father", toIds: [selin] }),
    ).rejects.toThrow();

    const country = await asOwner.query(api.entities.get, { entityId: kuzey });
    expect(country?.incoming).toEqual([
      { label: "Halkından", items: [{ _id: selin, kind: "character", name: "Selin" }] },
    ]);
  });

  test("a character's family is worked out from the parents", async () => {
    const { asOwner, make } = await writer();
    const grandma = await make("character", "Nene");
    const father = await make("character", "Aras");
    const mother = await make("character", "Leyla");
    const selin = await make("character", "Selin");
    const brother = await make("character", "Deniz");
    const daughter = await make("character", "Ada");
    const link = (entityId: typeof selin, role: string, to: typeof selin) =>
      asOwner.mutation(api.entities.setLinks, { entityId, role, toIds: [to] });
    await link(father, "mother", grandma);
    await link(selin, "father", father);
    await link(selin, "mother", mother);
    await link(brother, "father", father);
    await link(daughter, "mother", selin);

    const view = await asOwner.query(api.entities.get, { entityId: selin });
    expect(view?.family?.grandparents.map((c) => c.name)).toEqual(["Nene"]);
    expect(view?.family?.siblings.map((c) => c.name)).toEqual(["Deniz"]);
    expect(view?.family?.children.map((c) => c.name)).toEqual(["Ada"]);
    // Children are shown in the family, not again under "what links here".
    expect(view?.incoming).toEqual([]);
  });

  test("only the creator's own entities can be linked", async () => {
    const { t, authApi, asOwner, make } = await writer();
    const selin = await make("character", "Selin");
    const { t: asStranger } = await signInAsNewUser(t, authApi);
    const theirs = await asStranger.mutation(api.entities.create, { kind: "character", name: "Yabancı" });
    await expect(
      asOwner.mutation(api.entities.setLinks, { entityId: selin, role: "father", toIds: [theirs] }),
    ).rejects.toThrow();
    await expect(
      asStranger.mutation(api.entities.update, { entityId: selin, name: "Ele geçirildi" }),
    ).rejects.toThrow();
  });

  test("a reader sees an entity only through its writing, and only that writing's links", async () => {
    const { t, asOwner, bookId, make } = await writer();
    const selin = await make("character", "Selin");
    const secretFather = await make("character", "Gizli Baba", false);
    await asOwner.mutation(api.entities.setLinks, { entityId: selin, role: "father", toIds: [secretFather] });

    expect(await t.query(api.entities.get, { entityId: selin })).toBeNull();
    const read = await t.query(api.entities.get, { entityId: selin, bookId });
    expect(read?.canEdit).toBe(false);
    expect(read?.links.father).toEqual([]);
    expect(read?.books).toEqual([]);
    expect(await t.query(api.entities.get, { entityId: secretFather, bookId })).toBeNull();

    // A private writing hides its world too.
    await asOwner.mutation(api.books.update, { bookId, visibility: "private" });
    expect(await t.query(api.entities.get, { entityId: selin, bookId })).toBeNull();
    expect(await t.query(api.entities.listForBook, { bookId })).toEqual([]);
  });

  test("a field picture replaces the one before; the gallery keeps adding", async () => {
    const { t, asOwner, make } = await writer();
    const kuzey = await make("country", "Kuzey");
    const upload = () => t.run(async (ctx) => ctx.storage.store(new Blob(["x"])));
    const map1 = await upload();
    const map2 = await upload();
    const portrait = await upload();
    const second = await upload();
    await asOwner.mutation(api.entities.addImage, { entityId: kuzey, storageId: map1, slot: "map" });
    await asOwner.mutation(api.entities.addImage, { entityId: kuzey, storageId: map2, slot: "map" });
    await asOwner.mutation(api.entities.addImage, { entityId: kuzey, storageId: portrait });
    await asOwner.mutation(api.entities.addImage, { entityId: kuzey, storageId: second });
    await asOwner.mutation(api.entities.makeCover, { entityId: kuzey, storageId: second });
    await expect(
      asOwner.mutation(api.entities.addImage, { entityId: kuzey, storageId: map1, slot: "weapon" }),
    ).rejects.toThrow();

    const view = await asOwner.query(api.entities.get, { entityId: kuzey });
    expect(view?.images.map((i) => [i.storageId, i.slot])).toEqual([
      [second, null],
      [map2, "map"],
      [portrait, null],
    ]);
    expect(await t.run(async (ctx) => ctx.storage.getUrl(map1))).toBeNull();
  });
});

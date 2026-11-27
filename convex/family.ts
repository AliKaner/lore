import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { optionalUserId, viewableBook } from "./access";

// A character's family tree: up to three generations above and below, with
// spouses, worked out from the "Babası", "Annesi" and "Eşi" links. Its writer
// sees all of it; a reader sees it through a writing, and only the people
// who are part of that writing.

const MAX_GEN = 3;
const MAX_PEOPLE = 80;

type Person = {
  _id: Id<"entities">;
  name: string;
  gen: number;
  birthYear: string | null;
  coverUrl: string | null;
  // The person the tree was asked for.
  root: boolean;
};

async function cover(ctx: QueryCtx, entity: Doc<"entities">) {
  const image = entity.images.find((i) => i.slot === undefined);
  return image ? await ctx.storage.getUrl(image.storageId) : null;
}

export const tree = query({
  args: { entityId: v.id("entities"), bookId: v.optional(v.id("books")) },
  handler: async (ctx, args) => {
    const viewerId = await optionalUserId(ctx);
    const root = await ctx.db.get(args.entityId);
    if (!root || root.kind !== "character") return null;
    const isWriter = root.creatorId === viewerId;
    if (!isWriter) {
      if (args.bookId === undefined) return null;
      if ((await viewableBook(ctx, args.bookId, viewerId)) === null) return null;
    }
    const inBook = new Map<Id<"entities">, boolean>();
    const visible = async (id: Id<"entities">) => {
      if (isWriter) return true;
      if (!inBook.has(id)) {
        const link = await ctx.db
          .query("bookEntities")
          .withIndex("by_book_and_entity", (q) => q.eq("bookId", args.bookId!).eq("entityId", id))
          .unique();
        inBook.set(id, link !== null);
      }
      return inBook.get(id)!;
    };
    if (!(await visible(root._id))) return null;

    const people = new Map<Id<"entities">, Person>();
    const parentOf: { parent: Id<"entities">; child: Id<"entities"> }[] = [];
    const spouses: [Id<"entities">, Id<"entities">][] = [];
    const seenEdge = new Set<string>();

    const add = async (entity: Doc<"entities">, gen: number) => {
      people.set(entity._id, {
        _id: entity._id,
        name: entity.name,
        gen,
        birthYear: entity.fields.birthYear ?? null,
        coverUrl: await cover(ctx, entity),
        root: entity._id === root._id,
      });
    };
    await add(root, 0);
    const queue: Id<"entities">[] = [root._id];

    const reach = async (id: Id<"entities">, gen: number) => {
      if (Math.abs(gen) > MAX_GEN) return false;
      if (people.has(id)) return true;
      if (people.size >= MAX_PEOPLE) return false;
      const entity = await ctx.db.get(id);
      if (!entity || entity.kind !== "character" || entity.creatorId !== root.creatorId) return false;
      if (!(await visible(id))) return false;
      await add(entity, gen);
      queue.push(id);
      return true;
    };

    while (queue.length > 0) {
      const id = queue.shift()!;
      const gen = people.get(id)!.gen;
      // Parents.
      for (const role of ["father", "mother"]) {
        const rows = await ctx.db
          .query("entityLinks")
          .withIndex("by_from_and_role", (q) => q.eq("fromId", id).eq("role", role))
          .take(2);
        for (const row of rows) {
          if (await reach(row.toId, gen - 1)) {
            const key = `${row.toId}>${id}`;
            if (!seenEdge.has(key)) {
              seenEdge.add(key);
              parentOf.push({ parent: row.toId, child: id });
            }
          }
        }
      }
      // Spouses, either way round.
      const out = await ctx.db
        .query("entityLinks")
        .withIndex("by_from_and_role", (q) => q.eq("fromId", id).eq("role", "spouse"))
        .take(10);
      const incoming = await ctx.db
        .query("entityLinks")
        .withIndex("by_to", (q) => q.eq("toId", id))
        .take(200);
      for (const other of [...out.map((r) => r.toId), ...incoming.filter((r) => r.role === "spouse").map((r) => r.fromId)]) {
        if (await reach(other, gen)) {
          const key = [id, other].sort().join("=");
          if (!seenEdge.has(key)) {
            seenEdge.add(key);
            spouses.push([id, other]);
          }
        }
      }
      // Children: whoever names this person as a parent.
      for (const row of incoming.filter((r) => r.role === "father" || r.role === "mother")) {
        if (await reach(row.fromId, gen + 1)) {
          const key = `${id}>${row.fromId}`;
          if (!seenEdge.has(key)) {
            seenEdge.add(key);
            parentOf.push({ parent: id, child: row.fromId });
          }
        }
      }
    }

    return { people: [...people.values()], parentOf, spouses };
  },
});

// The links that make the relations web: family and the rest.
const WEB_ROLES = new Set(["father", "mother", "spouse", "friends", "loves", "enemies", "hates", "rivals", "mentors"]);

// Characters and how they relate: around one character (its neighbours and
// the links among them), or the writer's whole cast. A reader sees it
// through a writing, with only the people who are part of it.
export const web = query({
  args: { entityId: v.optional(v.id("entities")), bookId: v.optional(v.id("books")) },
  handler: async (ctx, args) => {
    const viewerId = await optionalUserId(ctx);
    let creatorId: Id<"users"> | null = null;
    if (args.entityId) {
      const root = await ctx.db.get(args.entityId);
      if (!root || root.kind !== "character") return null;
      creatorId = root.creatorId;
    } else {
      creatorId = viewerId;
    }
    if (creatorId === null) return null;
    const isWriter = creatorId === viewerId;
    if (!isWriter) {
      if (args.bookId === undefined) return null;
      if ((await viewableBook(ctx, args.bookId, viewerId)) === null) return null;
    }
    const inBook = new Map<Id<"entities">, boolean>();
    const visible = async (id: Id<"entities">) => {
      if (isWriter) return true;
      if (!inBook.has(id)) {
        const link = await ctx.db
          .query("bookEntities")
          .withIndex("by_book_and_entity", (q) => q.eq("bookId", args.bookId!).eq("entityId", id))
          .unique();
        inBook.set(id, link !== null);
      }
      return inBook.get(id)!;
    };

    // Who is in the picture.
    const people = new Map<Id<"entities">, Doc<"entities">>();
    const addPerson = async (entity: Doc<"entities"> | null) => {
      if (!entity || entity.kind !== "character" || entity.creatorId !== creatorId) return false;
      if (!(await visible(entity._id))) return false;
      people.set(entity._id, entity);
      return true;
    };
    const outgoing = async (id: Id<"entities">) =>
      (await ctx.db.query("entityLinks").withIndex("by_from_and_role", (q) => q.eq("fromId", id)).take(200)).filter((l) =>
        WEB_ROLES.has(l.role),
      );
    if (args.entityId) {
      const root = await ctx.db.get(args.entityId);
      if (!(await addPerson(root))) return null;
      for (const link of await outgoing(args.entityId)) await addPerson(await ctx.db.get(link.toId));
      const incoming = await ctx.db.query("entityLinks").withIndex("by_to", (q) => q.eq("toId", args.entityId!)).take(200);
      for (const link of incoming) if (WEB_ROLES.has(link.role)) await addPerson(await ctx.db.get(link.fromId));
    } else {
      const cast = await ctx.db
        .query("entities")
        .withIndex("by_creator_and_kind", (q) => q.eq("creatorId", creatorId!).eq("kind", "character"))
        .take(300);
      for (const entity of cast) await addPerson(entity);
    }

    // Every link among them.
    const edges: { from: Id<"entities">; to: Id<"entities">; role: string }[] = [];
    for (const id of people.keys()) {
      for (const link of await outgoing(id)) {
        if (people.has(link.toId) && link.toId !== id) edges.push({ from: id, to: link.toId, role: link.role });
      }
    }
    // Only people with at least one link, plus the one asked about.
    const linked = new Set(edges.flatMap((e) => [e.from, e.to]));
    const nodes = await Promise.all(
      [...people.values()]
        .filter((p) => linked.has(p._id) || p._id === args.entityId)
        .map(async (p) => ({ _id: p._id, name: p.name, coverUrl: await cover(ctx, p), root: p._id === args.entityId })),
    );
    return { nodes, edges };
  },
});

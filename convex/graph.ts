import { query } from "./_generated/server";
import { v } from "convex/values";

const TYPE_LABEL: Record<string, string> = {
  character: "Karakter",
  city: "Şehir",
  item: "Eşya",
  story: "Hikaye",
  other: "Diğer",
  location: "Mekan",
  faction: "Hizip",
};

export const getUniverseGraph = query({
  args: { universeId: v.id("universes") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_universe", (q) => q.eq("universeId", args.universeId))
      .collect();
    const bookTitleById = new Map(books.map((b) => [b._id, b.title]));

    const chaptersByBook = await Promise.all(
      books.map((b) =>
        ctx.db
          .query("chapters")
          .withIndex("by_book", (q) => q.eq("bookId", b._id))
          .collect()
      )
    );
    const chapters = chaptersByBook.flat();

    const entries = await ctx.db
      .query("loreEntries")
      .withIndex("by_universe", (q) => q.eq("universeId", args.universeId))
      .collect();

    const knownIds = new Set(
      [...chapters.map((c) => c._id as string), ...entries.map((e) => e._id as string)]
    );

    const allLinks = await ctx.db.query("links").collect();
    const relevantLinks = allLinks.filter(
      (l) => knownIds.has(l.sourceId) && knownIds.has(l.targetId)
    );

    const nodes = [
      ...chapters.map((c) => ({
        id: c._id as string,
        type: "chapter" as const,
        label: c.title,
        subtitle: bookTitleById.get(c.bookId) ?? "",
        imageUrl: null as string | null,
        bookId: c.bookId as string,
      })),
      ...(await Promise.all(
        entries.map(async (e) => ({
          id: e._id as string,
          type: e.type as string,
          label: e.name,
          subtitle: TYPE_LABEL[e.type] ?? e.type,
          imageUrl: e.imageStorageId ? await ctx.storage.getUrl(e.imageStorageId) : null,
        }))
      )),
    ];

    const treeEdges = chapters.flatMap((c) => {
      const edges: { id: string; source: string; target: string; linkType: string }[] = [];
      if (c.parentChapterId) {
        edges.push({
          id: `tree:${c.parentChapterId}:${c._id}`,
          source: c.parentChapterId as string,
          target: c._id as string,
          linkType: "next",
        });
      }
      (c.branchIds ?? []).forEach((branchId) => {
        edges.push({
          id: `tree:${c._id}:${branchId}`,
          source: c._id as string,
          target: branchId as string,
          linkType: "branch",
        });
      });
      return edges;
    });

    const linkEdges = relevantLinks.map((l) => ({
      id: l._id as string,
      source: l.sourceId,
      target: l.targetId,
      linkType: l.linkType,
    }));

    // De-dupe tree edges that were also entered via the generic links table.
    const seen = new Set<string>();
    const edges = [...treeEdges, ...linkEdges].filter((e) => {
      const key = `${e.source}->${e.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { nodes, edges };
  },
});

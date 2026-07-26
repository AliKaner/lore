import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SITE_URL } from "./constants/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [universes, entries, books, chapters, boardGames] = await Promise.all([
    fetchQuery(api.universes.list, {}),
    fetchQuery(api.loreEntries.list, {}),
    fetchQuery(api.books.list, {}),
    fetchQuery(api.chapters.list, {}),
    fetchQuery(api.boardGames.list, {}),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const universeRoutes: MetadataRoute.Sitemap = universes.map((u) => ({
    url: `${SITE_URL}/universe/${u._id}`,
    lastModified: new Date(u._creationTime),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const loreRoutes: MetadataRoute.Sitemap = entries
    .filter((e) => e.status !== "pending")
    .map((e) => ({
      url: `${SITE_URL}/lore/${e._id}`,
      lastModified: new Date(e._creationTime),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const bookRoutes: MetadataRoute.Sitemap = books.map((b) => ({
    url: `${SITE_URL}/book/${b._id}`,
    lastModified: new Date(b._creationTime),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const chapterRoutes: MetadataRoute.Sitemap = chapters
    .filter((c) => c.status !== "pending")
    .map((c) => ({
      url: `${SITE_URL}/book/${c.bookId}/${c._id}`,
      lastModified: new Date(c._creationTime),
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  const boardGameRoutes: MetadataRoute.Sitemap = boardGames.map((g) => ({
    url: `${SITE_URL}/board-game/${g._id}`,
    lastModified: new Date(g._creationTime),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...universeRoutes,
    ...loreRoutes,
    ...bookRoutes,
    ...chapterRoutes,
    ...boardGameRoutes,
  ];
}

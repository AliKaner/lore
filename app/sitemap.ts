import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The pages meant to be found. Writings are shared by link and stay out of
// search engines until the community opens; the writer's desk is private.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/giris`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/llms.txt`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}

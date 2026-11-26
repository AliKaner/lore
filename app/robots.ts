import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines and AI crawlers may read the public pages and the AI
// guide; the writer's desk and private screens are off limits. Shared
// writings also say "noindex" themselves.
const PRIVATE = [
  "/yazilarim",
  "/yaz",
  "/hesap",
  "/evren",
  "/karakterler",
  "/mekanlar",
  "/kutuphanem",
  "/moderasyon",
  "/profil/",
  "/kitap/",
  "/auth/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/llms.txt", "/llms-full.txt"], disallow: PRIVATE },
      // AI assistants: welcome to the public pages and the guide, never to
      // anyone's writing.
      {
        userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended"],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: PRIVATE,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

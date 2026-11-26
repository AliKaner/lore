import type { MetadataRoute } from "next";

// Lets Booktion be added to a phone's home screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Booktion",
    short_name: "Booktion",
    description:
      "Her yazıya kendi masası: roman, öykü, şiir, köşe yazısı, röportaj ve günlük için yazı platformu.",
    start_url: "/my-writing",
    display: "standalone",
    background_color: "#f4f6fb",
    theme_color: "#0f1939",
    lang: "tr",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

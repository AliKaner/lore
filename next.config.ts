import type { NextConfig } from "next";

// Booktion's addresses used to be Turkish. Old links (shared books, bookmarks,
// search results) keep working by moving permanently to the English ones.
const OLD_PATHS: [string, string][] = [
  ["/kitap/:book/bolum/:chapter/yaz", "/book/:book/chapter/:chapter/write"],
  ["/kitap/:book/bolum/:chapter/duzenle", "/book/:book/chapter/:chapter/edit"],
  ["/kitap/:book/bolum/:chapter", "/book/:book/chapter/:chapter"],
  ["/kitap/:book/evren/:entity", "/book/:book/world/:entity"],
  ["/kitap/:book/yazdir", "/book/:book/print"],
  ["/kitap/:book/yaz", "/book/:book/write"],
  ["/kitap/:book", "/book/:book"],
  ["/evren/:entity", "/world/:entity"],
  ["/evren", "/world"],
  ["/karakterler", "/world?kind=character"],
  ["/mekanlar", "/world?kind=place"],
  ["/profil/:user", "/profile/:user"],
  ["/giris", "/sign-in"],
  ["/yazilarim", "/my-writing"],
  ["/yaz", "/new"],
  ["/hesap", "/account"],
  ["/kesfet", "/discover"],
  ["/kutuphanem", "/library"],
  ["/moderasyon", "/moderation"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return OLD_PATHS.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

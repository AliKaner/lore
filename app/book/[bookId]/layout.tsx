import type { Metadata } from "next";
import type { ReactNode } from "react";
import { bookForShare } from "@/lib/shareMeta";

// A writing is shared by link while the community is closed, so its pages
// carry a proper preview card but stay out of search engines.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}): Promise<Metadata> {
  const { bookId } = await params;
  const book = await bookForShare(bookId);
  const robots = { index: false, follow: false };
  if (!book) return { robots };
  const byline = book.author ? `${book.kind} · @${book.author}` : book.kind;
  const description = book.description ?? `${byline} — Booktion'da oku.`;
  return {
    title: book.title,
    description,
    robots,
    alternates: { canonical: `/book/${bookId}` },
    openGraph: { type: "book", title: book.title, description, url: `/book/${bookId}` },
    twitter: { card: "summary_large_image", title: book.title, description },
  };
}

export default function BookLayout({ children }: { children: ReactNode }) {
  return children;
}

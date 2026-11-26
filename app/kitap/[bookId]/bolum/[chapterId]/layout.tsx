import type { Metadata } from "next";
import type { ReactNode } from "react";
import { bookForShare, chapterForShare } from "@/lib/shareMeta";

// A shared chapter: its title, the writing's title and the first lines.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}): Promise<Metadata> {
  const { bookId, chapterId } = await params;
  const [book, chapter] = await Promise.all([bookForShare(bookId), chapterForShare(chapterId)]);
  const robots = { index: false, follow: false };
  if (!book || !chapter) return { robots };
  const title = `${chapter.title} — ${book.title}`;
  const description = chapter.excerpt || book.description || `${book.kind} · Booktion`;
  return {
    title,
    description,
    robots,
    alternates: { canonical: `/kitap/${bookId}/bolum/${chapterId}` },
    // The writing's card; a page that sets its own openGraph doesn't inherit it.
    openGraph: {
      type: "article",
      title,
      description,
      url: `/kitap/${bookId}/bolum/${chapterId}`,
      images: [{ url: `/kitap/${bookId}/opengraph-image`, width: 1200, height: 630, alt: book.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`/kitap/${bookId}/twitter-image`] },
  };
}

export default function ChapterLayout({ children }: { children: ReactNode }) {
  return children;
}

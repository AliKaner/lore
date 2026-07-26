import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SITE_URL, DEFAULT_OG_IMAGE, excerpt } from "@/app/constants/site";
import ChapterClient from "./ChapterClient";

type Props = { params: Promise<{ bookId: string; chapterId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId, chapterId } = await params;
  const [chapter, book] = await Promise.all([
    fetchQuery(api.chapters.getById, { id: chapterId as Id<"chapters"> }),
    fetchQuery(api.books.getById, { id: bookId as Id<"books"> }),
  ]);

  if (!chapter || !book) {
    return { title: "Chapter Not Found" };
  }

  const title = `${chapter.title} — ${book.title}`;
  const description = excerpt(chapter.contentTr || chapter.contentEn);
  const image = book.coverUrl ?? DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/book/${bookId}/${chapterId}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/book/${bookId}/${chapterId}`,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function ChapterDetailPage({ params }: Props) {
  return <ChapterClient params={params} />;
}

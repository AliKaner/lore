import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/app/constants/site";
import BookClient from "./BookClient";

type Props = { params: Promise<{ bookId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId } = await params;
  const book = await fetchQuery(api.books.getById, {
    id: bookId as Id<"books">,
  });

  if (!book) {
    return { title: "Book Not Found" };
  }

  const description =
    book.description ?? "Discover the rich lore and stories that shape our universe";
  const image = book.coverUrl ?? DEFAULT_OG_IMAGE;

  return {
    title: book.title,
    description,
    alternates: { canonical: `${SITE_URL}/book/${bookId}` },
    openGraph: {
      title: book.title,
      description,
      url: `${SITE_URL}/book/${bookId}`,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description,
      images: [image],
    },
  };
}

export default function BookDetailPage({ params }: Props) {
  return <BookClient params={params} />;
}

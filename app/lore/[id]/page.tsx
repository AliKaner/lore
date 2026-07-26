import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SITE_URL, DEFAULT_OG_IMAGE, excerpt } from "@/app/constants/site";
import LoreDetailClient from "./LoreDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const entry = await fetchQuery(api.loreEntries.getById, {
    id: id as Id<"loreEntries">,
  });

  if (!entry) {
    return { title: "Lore Not Found" };
  }

  const description = excerpt(entry.contentTr || entry.contentEn);
  const image = entry.imageUrl ?? DEFAULT_OG_IMAGE;

  return {
    title: entry.name,
    description,
    alternates: { canonical: `${SITE_URL}/lore/${id}` },
    openGraph: {
      title: entry.name,
      description,
      url: `${SITE_URL}/lore/${id}`,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.name,
      description,
      images: [image],
    },
  };
}

export default function LoreDetail({ params }: Props) {
  return <LoreDetailClient params={params} />;
}

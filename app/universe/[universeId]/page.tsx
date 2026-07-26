import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/app/constants/site";
import UniverseClient from "./UniverseClient";

type Props = { params: Promise<{ universeId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { universeId } = await params;
  const universe = await fetchQuery(api.universes.getById, {
    id: universeId as Id<"universes">,
  });

  if (!universe) {
    return { title: "Universe Not Found" };
  }

  const description =
    universe.description ??
    "Discover the rich lore and stories that shape our universe";
  const image = universe.imageUrl ?? DEFAULT_OG_IMAGE;

  return {
    title: universe.name,
    description,
    alternates: { canonical: `${SITE_URL}/universe/${universeId}` },
    openGraph: {
      title: universe.name,
      description,
      url: `${SITE_URL}/universe/${universeId}`,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: universe.name,
      description,
      images: [image],
    },
  };
}

export default function UniversePage({ params }: Props) {
  return <UniverseClient params={params} />;
}

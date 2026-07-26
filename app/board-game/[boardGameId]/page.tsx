import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/app/constants/site";
import BoardGameClient from "./BoardGameClient";

type Props = { params: Promise<{ boardGameId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { boardGameId } = await params;
  const game = await fetchQuery(api.boardGames.getById, {
    id: boardGameId as Id<"boardGames">,
  });

  if (!game) {
    return { title: "Game Not Found" };
  }

  const description =
    game.description ?? "Discover the rich lore and stories that shape our universe";
  const image = game.coverUrl ?? DEFAULT_OG_IMAGE;

  return {
    title: game.title,
    description,
    alternates: { canonical: `${SITE_URL}/board-game/${boardGameId}` },
    openGraph: {
      title: game.title,
      description,
      url: `${SITE_URL}/board-game/${boardGameId}`,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: game.title,
      description,
      images: [image],
    },
  };
}

export default function BoardGamePage({ params }: Props) {
  return <BoardGameClient params={params} />;
}

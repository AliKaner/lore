import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCommunityOpen(): boolean {
  return useQuery(api.books.communityStatus)?.open ?? false;
}

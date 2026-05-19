import { useQuery } from "@tanstack/react-query";
import { fetchAiInsights } from "../api/aiApi";
import { useAuth } from "../context/AuthContext";
import { getArtistId } from "../lib/auth";

export function useAiInsights() {
  const { user } = useAuth();
  const artistId = getArtistId(user);

  return useQuery({
    queryKey: ["ai-insights", artistId],
    queryFn: () => fetchAiInsights(artistId),
  });
}

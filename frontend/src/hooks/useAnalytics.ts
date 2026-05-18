import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "../api/analyticsApi";
import { useAuth } from "../context/AuthContext";
import { getArtistId } from "../lib/auth";

export function useAnalytics(period?: string) {
  const { user } = useAuth();
  const artistId = getArtistId(user);
  return useQuery({
    queryKey: ["analytics", artistId, period],
    queryFn: () => fetchAnalytics(artistId, period),
  });
}

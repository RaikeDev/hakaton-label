import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/dashboardApi";
import { useAuth } from "../context/AuthContext";
import { getArtistId } from "../lib/auth";

export function useDashboard() {
  const { user } = useAuth();
  const artistId = getArtistId(user);
  return useQuery({
    queryKey: ["dashboard", artistId],
    queryFn: () => fetchDashboard(artistId),
  });
}

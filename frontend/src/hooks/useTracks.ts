import { useQuery } from "@tanstack/react-query";
import { fetchTracks } from "../api/tracksApi";
import { useAuth } from "../context/AuthContext";
import { getArtistId } from "../lib/auth";

export function useTracks(search?: string, status?: string) {
  const { user } = useAuth();
  const artistId = getArtistId(user);
  return useQuery({
    queryKey: ["tracks", artistId, search, status],
    queryFn: () => fetchTracks(artistId, search, status),
  });
}

import { useQuery } from "@tanstack/react-query";
import { fetchArtists } from "../api/artistsApi";

export function useArtists() {
  return useQuery({
    queryKey: ["artists"],
    queryFn: fetchArtists,
  });
}

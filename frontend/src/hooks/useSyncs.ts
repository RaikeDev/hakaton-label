import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSyncs, createSync } from "../api/syncsApi";
import { useAuth } from "../context/AuthContext";
import { getArtistId } from "../lib/auth";

export function useSyncs() {
  const { user } = useAuth();
  const artistId = getArtistId(user);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["syncs", artistId],
    queryFn: () => fetchSyncs(artistId),
  });

  const addSync = useMutation({
    mutationFn: createSync,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["syncs"] }),
  });

  return { ...query, addSync };
}

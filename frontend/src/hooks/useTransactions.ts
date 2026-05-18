import { useQuery } from "@tanstack/react-query";
import { fetchTransactions } from "../api/transactionsApi";
import { useAuth } from "../context/AuthContext";
import { getArtistId } from "../lib/auth";

export function useTransactions() {
  const { user } = useAuth();
  const artistId = getArtistId(user);
  return useQuery({
    queryKey: ["transactions", artistId],
    queryFn: () => fetchTransactions(artistId),
  });
}

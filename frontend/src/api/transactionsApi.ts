import { api } from "./client";

export async function fetchTransactions(artistId: number) {
  const { data } = await api.get("/transactions", { params: { artist_id: artistId } });
  return data;
}

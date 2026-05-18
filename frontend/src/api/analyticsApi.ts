import { api } from "./client";

export async function fetchAnalytics(artistId: number, period?: string) {
  const { data } = await api.get("/analytics", {
    params: { artist_id: artistId, period },
  });
  return data;
}

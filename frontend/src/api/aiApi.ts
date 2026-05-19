import { api } from "./client";

export async function fetchAiInsights(artistId: number) {
  const { data } = await api.get("/ai/insights", {
    params: { artist_id: artistId },
  });
  return data;
}

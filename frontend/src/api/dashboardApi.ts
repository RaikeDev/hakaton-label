import { api } from "./client";

export async function fetchDashboard(artistId: number) {
  const { data } = await api.get("/dashboard", { params: { artist_id: artistId } });
  return data;
}

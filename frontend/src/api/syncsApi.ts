import { api } from "./client";

export async function fetchSyncs(artistId: number) {
  const { data } = await api.get("/syncs", { params: { artist_id: artistId } });
  return data;
}

export async function createSync(payload: object) {
  const { data } = await api.post("/syncs", payload);
  return data;
}

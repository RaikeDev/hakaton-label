import { api } from "./client";

export async function fetchTracks(artistId: number, search?: string, status?: string) {
  const { data } = await api.get("/tracks", {
    params: { artist_id: artistId, search, status },
  });
  return data;
}

export async function createTrack(payload: object) {
  const { data } = await api.post("/tracks", payload);
  return data;
}

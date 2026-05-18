import { api } from "./client";

export async function fetchApprovals(artistId: number) {
  const { data } = await api.get("/approvals", { params: { artist_id: artistId } });
  return data;
}

export async function updateApprovalStatus(id: number, status: string) {
  const { data } = await api.patch(`/approvals/${id}/status`, { status });
  return data;
}

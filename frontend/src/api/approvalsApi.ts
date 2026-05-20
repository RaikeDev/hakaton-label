import { api } from "./client";

export async function fetchApprovals(artistId: number) {
  const { data } = await api.get("/approvals", { params: { artist_id: artistId } });
  return data;
}

export async function updateApprovalStatus(id: number, status: string) {
  const { data } = await api.patch(`/approvals/${id}/status`, { status });
  return data;
}

export interface CreateApprovalPayload {
  title: string;
  distributor?: string;
  tracks: string[];
  planned_release?: string | null;
}

export async function createApproval(artistId: number, payload: CreateApprovalPayload) {
  const { data } = await api.post("/approvals", payload, { params: { artist_id: artistId } });
  return data;
}

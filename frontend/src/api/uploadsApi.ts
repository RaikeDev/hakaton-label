import { api } from "./client";

export async function uploadRoyaltyReport(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/uploads/royalty-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadDemoRoyaltyReport() {
  const { data } = await api.post("/uploads/demo-royalty-report");
  return data;
}

export interface LastUpload {
  id: number;
  filename: string;
  status: string;
  rows_total: number;
  rows_success: number;
  rows_failed: number;
  created_at: string | null;
}

export async function fetchLastUpload(): Promise<LastUpload | null> {
  const { data } = await api.get("/uploads/last");
  return data;
}

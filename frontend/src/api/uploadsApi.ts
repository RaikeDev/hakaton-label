import { api } from "./client";

export async function uploadRoyaltyReport(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/uploads/royalty-report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

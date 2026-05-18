import { api } from "./client";

export async function fetchPayments(artistId: number) {
  const { data } = await api.get("/payments", { params: { artist_id: artistId } });
  return data;
}

export async function approvePayment(id: number) {
  const { data } = await api.post(`/payments/${id}/approve`);
  return data;
}

export async function markPaymentPaid(id: number, paidDate: string) {
  const { data } = await api.post(`/payments/${id}/mark-paid`, { paid_date: paidDate });
  return data;
}

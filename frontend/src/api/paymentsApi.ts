import { api } from "./client";

export type PaymentStatus = "pending" | "approved" | "paid";

export interface Payment {
  id: number;
  period: string;
  amount: number;
  payout: number;
  tax: number | null;
  commission: number | null;
  status: PaymentStatus;
  paid_date: string | null;
}

export async function fetchPayments(artistId: number): Promise<Payment[]> {
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPayments, approvePayment, markPaymentPaid } from "../api/paymentsApi";
import { useAuth } from "../context/AuthContext";
import { getArtistId } from "../lib/auth";

export function usePayments() {
  const { user } = useAuth();
  const artistId = getArtistId(user);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["payments", artistId],
    queryFn: () => fetchPayments(artistId),
  });

  const approveMutation = useMutation({
    mutationFn: approvePayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => markPaymentPaid(id, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return { ...query, approveMutation, markPaidMutation };
}

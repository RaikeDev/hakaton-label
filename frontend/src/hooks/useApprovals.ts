import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApprovals, updateApprovalStatus } from "../api/approvalsApi";
import { useAuth } from "../context/AuthContext";
import { getArtistId } from "../lib/auth";

export function useApprovals() {
  const { user } = useAuth();
  const artistId = getArtistId(user);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["approvals", artistId],
    queryFn: () => fetchApprovals(artistId),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateApprovalStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }),
  });

  return { ...query, updateStatus };
}

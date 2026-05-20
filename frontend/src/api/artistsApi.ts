import { api } from "./client";

export interface ArtistSummary {
  id: number;
  stage_name: string;
  real_name: string | null;
  genre: string | null;
  label_name: string;
  artist_share_percent: number;
  avatar_url: string | null;
  datalens_url: string | null;
  contract_since: string | null;
  bank_name: string | null;
  account_number: string | null;
  recipient_name: string | null;
}

export interface PayoutDetails {
  bank_name: string;
  account_number: string;
  recipient_name: string;
}

export async function fetchArtists() {
  const { data } = await api.get<ArtistSummary[]>("/artists");
  return data;
}

export async function updateArtistDataLensUrl(artistId: number, datalensUrl: string) {
  const { data } = await api.patch(`/artists/${artistId}/datalens`, {
    datalens_url: datalensUrl.trim() || null,
  });
  return data;
}

export async function updateArtistPayoutDetails(artistId: number, details: PayoutDetails) {
  const { data } = await api.patch(`/artists/${artistId}/payout-details`, details);
  return data;
}

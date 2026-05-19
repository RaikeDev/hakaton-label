import { api } from "./client";

export type AiInsightType = "opportunity" | "risk" | "action";

export interface AiInsight {
  type: AiInsightType;
  title: string;
  description: string;
  metric: string;
  confidence: number;
}

export interface AiPlatformSummary {
  code: string;
  name: string;
  streams: number;
  revenue: number;
}

export interface AiTrackSummary {
  id: number;
  title: string;
  streams: number;
  revenue: number;
  release_date: string | null;
}

export interface AiCashflowSummary {
  income: number;
  payouts: number;
  pending: number;
  balance: number;
}

export interface AiInsightsResponse {
  artist: {
    id: number;
    name: string;
    genre: string | null;
    share_percent: number;
  } | null;
  summary: {
    tracks_count: number;
    streams: number;
    revenue: number;
    periods: string[];
    platforms: AiPlatformSummary[];
    top_tracks: AiTrackSummary[];
    cashflow: AiCashflowSummary;
    generated_at: string;
  };
  insights: AiInsight[];
  actions: string[];
}

export async function fetchAiInsights(artistId: number): Promise<AiInsightsResponse> {
  const { data } = await api.get("/ai/insights", {
    params: { artist_id: artistId },
  });
  return data;
}

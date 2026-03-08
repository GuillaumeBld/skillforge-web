// lib/engine.ts
import type { MatchRequest, MatchResponse, DemandResponse } from "@/types/skillforge";

const BASE = "/api/engine"; // proxied by next.config.ts rewrites

export async function matchOccupations(req: MatchRequest): Promise<MatchResponse> {
  const res = await fetch(`${BASE}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Engine error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getDemand(nocCode: string): Promise<DemandResponse> {
  const res = await fetch(`${BASE}/demand/${nocCode}`);
  if (!res.ok) throw new Error(`Demand fetch failed: ${res.status}`);
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveIntakeRecord(record: {
  school_id: string;
  worker_title: string;
  source_noc: string;
  matched_noc: string;
  matched_title: string;
  composite_score: number;
  funding_eligible: boolean;
  province: string;
}) {
  // Fire-and-forget — don't block the UI on intake persistence
  fetch(`${BASE}/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  }).catch((e) => console.warn("intake record save failed:", e));
}

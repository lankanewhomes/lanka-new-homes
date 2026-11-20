// Simple per-developer monthly report: views (impressions), clicks and leads, by placement.
import { supabaseAdmin } from "@/lib/supabase";
import { PLACEMENT_LABEL, PLACEMENT_MIN_TIER, TIER_RANK, type Placement } from "./config";
import { demoReportNumbers, FEATURED_DEMO } from "./demo";
import { activePackages } from "./engine";
import { getFeaturedData } from "./store";

export type ReportRow = { placement: Placement; label: string; impressions: number; clicks: number; leads: number };

export async function getMonthlyReport(developerSlug: string, month: string): Promise<{ rows: ReportRow[]; demo: boolean }> {
  if (FEATURED_DEMO) {
    // Invented numbers for the placements this developer's demo package actually unlocks.
    const { state } = await getFeaturedData();
    const pkg = activePackages(state, new Date()).find((entry) => entry.developerSlug === developerSlug);
    const placements = (Object.keys(PLACEMENT_LABEL) as Placement[]).filter((placement) => {
      const min = PLACEMENT_MIN_TIER[placement];
      return min && pkg && TIER_RANK[pkg.tier] >= TIER_RANK[min];
    });
    return { demo: true, rows: placements.map((placement) => ({ placement, label: PLACEMENT_LABEL[placement], ...demoReportNumbers(`${developerSlug}:${month}`, placement) })) };
  }
  const start = `${month}-01T00:00:00Z`;
  const [year, mon] = month.split("-").map(Number);
  const end = new Date(Date.UTC(year, mon, 1)).toISOString();
  const { data, error } = await supabaseAdmin.from("featured_events").select("event, placement").eq("developer_slug", developerSlug).gte("at", start).lt("at", end).limit(50_000);
  if (error) return { rows: [], demo: false };
  const byPlacement = new Map<string, { impressions: number; clicks: number; leads: number }>();
  for (const row of (data ?? []) as { event: string; placement: string }[]) {
    const entry = byPlacement.get(row.placement) ?? { impressions: 0, clicks: 0, leads: 0 };
    if (row.event === "impression") entry.impressions += 1;
    else if (row.event === "click") entry.clicks += 1;
    else if (row.event === "lead") entry.leads += 1;
    byPlacement.set(row.placement, entry);
  }
  return {
    demo: false,
    rows: [...byPlacement].map(([placement, counts]) => ({ placement: placement as Placement, label: PLACEMENT_LABEL[placement as Placement] ?? placement, ...counts })).sort((a, b) => b.impressions - a.impressions),
  };
}

import type { Payload } from "payload";
import type { DigestPeriod } from "@/lib/analytics-digest";
import { getPackage } from "@/lib/packages";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ProjectWeeklySummary = {
  projectId: string | number;
  projectName: string;
  packageTier: string;
  views: number;
  previousViews: number;
  inquiries: number;
  previousInquiries: number;
  saves: number;
  downloads: number;
  topLocations: string[];
};

// Counts a real Analytics event type for one project in a date range,
// excluding duplicates/bots — same exclusion rule
// hooks/increment-counts.ts already uses for the live view_count/etc
// counters, so this matches what a developer sees elsewhere exactly.
async function countEvents(payload: Payload, projectId: string | number, eventType: string, start: string, end: string): Promise<number> {
  const { totalDocs } = await payload.count({
    collection: "analytics",
    where: {
      project: { equals: projectId },
      event_type: { equals: eventType },
      is_duplicate: { equals: false },
      is_bot: { equals: false },
      timestamp: { greater_than_equal: start, less_than: end },
    },
    overrideAccess: true,
  });
  return totalDocs;
}

async function topLocationsForProject(payload: Payload, projectId: string | number, start: string, end: string): Promise<string[]> {
  const { docs } = await payload.find({
    collection: "analytics",
    where: {
      project: { equals: projectId },
      event_type: { equals: "view" },
      is_duplicate: { equals: false },
      is_bot: { equals: false },
      timestamp: { greater_than_equal: start, less_than: end },
      region: { exists: true },
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });
  const counts = new Map<string, number>();
  for (const doc of docs) {
    const region = typeof doc.region === "string" && doc.region.trim() ? doc.region.trim() : null;
    if (!region) continue;
    counts.set(region, (counts.get(region) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([region]) => region);
}

// Only for projects with an active paid package (Featured/Premium) — Free
// listings get no weekly report, matching the packages.ts feature gate.
// Everything here comes from the existing Analytics event log — no new
// tracking added.
export async function buildProjectWeeklySummaries(
  payload: Payload,
  projects: { id: string | number; name: string; package?: string | null }[],
  period: DigestPeriod,
): Promise<ProjectWeeklySummary[]> {
  const paidProjects = projects.filter((p) => getPackage(p.package).weeklyReports);
  if (paidProjects.length === 0) return [];

  const currentStart = `${period.startDate}T00:00:00.000Z`;
  const currentEnd = `${period.endDate}T00:00:00.000Z`;
  const previousStart = new Date(new Date(currentStart).getTime() - 7 * DAY_MS).toISOString();

  return Promise.all(
    paidProjects.map(async (project) => {
      const [views, previousViews, inquiries, previousInquiries, saves, downloads, topLocations] = await Promise.all([
        countEvents(payload, project.id, "view", currentStart, currentEnd),
        countEvents(payload, project.id, "view", previousStart, currentStart),
        countEvents(payload, project.id, "lead_submitted", currentStart, currentEnd),
        countEvents(payload, project.id, "lead_submitted", previousStart, currentStart),
        countEvents(payload, project.id, "save", currentStart, currentEnd),
        countEvents(payload, project.id, "brochure_download", currentStart, currentEnd),
        topLocationsForProject(payload, project.id, currentStart, currentEnd),
      ]);
      return {
        projectId: project.id,
        projectName: project.name,
        packageTier: project.package || "free",
        views,
        previousViews,
        inquiries,
        previousInquiries,
        saves,
        downloads,
        topLocations,
      };
    }),
  );
}

export function formatWeeklyChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "new this week" : "no change";
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

import type { Payload } from "payload";
import { runGa4Report } from "@/lib/ga4-data-client";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DigestPeriod = { startDate: string; endDate: string };

export function lastWeekPeriod(): DigestPeriod {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * DAY_MS);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

type DeveloperDigest = {
  developerId: string | number;
  developerName: string;
  email: string;
  totalViews: number;
  totalInquiries: number;
  topTrafficSource: string | null;
  leadStatusCounts: Record<string, number>;
};

async function buildDeveloperDigest(payload: Payload, developer: { id: string | number; name: string; email: string }, period: DigestPeriod): Promise<DeveloperDigest | null> {
  const projectsRes = await payload.find({
    collection: "projects",
    where: { developer: { equals: developer.id } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  const projects = projectsRes.docs;
  if (projects.length === 0) return null;

  const [viewReports, trafficReports, leadsInRange, allLeads] = await Promise.all([
    Promise.all(
      projects.map((project) =>
        runGa4Report({
          startDate: period.startDate,
          endDate: period.endDate,
          dimensions: [],
          metrics: ["eventCount"],
          filters: [
            { field: "customEvent:listing_id", value: project.slug },
            { field: "eventName", value: "view_listing" },
          ],
        }),
      ),
    ),
    Promise.all(
      projects.map((project) =>
        runGa4Report({
          startDate: period.startDate,
          endDate: period.endDate,
          dimensions: ["sessionDefaultChannelGroup"],
          metrics: ["sessions"],
          filters: [{ field: "customEvent:listing_id", value: project.slug }],
        }),
      ),
    ),
    payload.count({
      collection: "leads",
      where: {
        project: { in: projects.map((p) => p.id) },
        createdAt: { greater_than_equal: period.startDate, less_than_equal: period.endDate },
      },
      overrideAccess: true,
    }),
    payload.find({
      collection: "leads",
      where: { project: { in: projects.map((p) => p.id) } },
      limit: 2000,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  const totalViews = viewReports.reduce((sum, rows) => sum + Math.round(rows[0]?.metricValues[0] ?? 0), 0);

  const channelTotals = new Map<string, number>();
  for (const rows of trafficReports) {
    for (const row of rows) {
      const channel = row.dimensionValues[0] || "Unassigned";
      channelTotals.set(channel, (channelTotals.get(channel) ?? 0) + Math.round(row.metricValues[0] ?? 0));
    }
  }
  let topTrafficSource: string | null = null;
  let topSessions = 0;
  for (const [channel, sessions] of channelTotals) {
    if (sessions > topSessions) {
      topSessions = sessions;
      topTrafficSource = channel;
    }
  }

  const leadStatusCounts: Record<string, number> = { new: 0, contacted: 0, toured: 0, sold: 0 };
  for (const doc of allLeads.docs) {
    const status = typeof doc.status === "string" ? doc.status : "new";
    leadStatusCounts[status] = (leadStatusCounts[status] ?? 0) + 1;
  }

  return {
    developerId: developer.id,
    developerName: developer.name,
    email: developer.email,
    totalViews,
    totalInquiries: leadsInRange.totalDocs,
    topTrafficSource,
    leadStatusCounts,
  };
}

function digestEmailHtml(digest: DeveloperDigest, period: DigestPeriod, dashboardUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2>Your weekly performance summary</h2>
      <p>${period.startDate} – ${period.endDate}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0;">Total views</td><td style="padding: 6px 0; text-align: right;"><strong>${digest.totalViews}</strong></td></tr>
        <tr><td style="padding: 6px 0;">Total inquiries</td><td style="padding: 6px 0; text-align: right;"><strong>${digest.totalInquiries}</strong></td></tr>
        <tr><td style="padding: 6px 0;">Top traffic source</td><td style="padding: 6px 0; text-align: right;"><strong>${digest.topTrafficSource ?? "—"}</strong></td></tr>
      </table>
      <p>Lead status right now: ${digest.leadStatusCounts.new} new, ${digest.leadStatusCounts.contacted} contacted, ${digest.leadStatusCounts.toured} toured, ${digest.leadStatusCounts.sold} sold.</p>
      <p><a href="${dashboardUrl}">View your full dashboard</a></p>
    </div>
  `;
}

// Runs weekly (triggered by Vercel Cron → src/app/(frontend)/api/cron/analytics-digest/route.ts).
// Best-effort per developer: one failing send/report doesn't stop the rest.
export async function sendWeeklyAnalyticsDigests(payload: Payload, period: DigestPeriod = lastWeekPeriod()): Promise<{ sent: number; skipped: number; failed: number }> {
  const developersRes = await payload.find({
    collection: "developers",
    where: { user: { exists: true } },
    limit: 500,
    depth: 1,
    overrideAccess: true,
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const serverURL = payload.config.serverURL || "https://lankanewhomes.com";

  for (const developer of developersRes.docs) {
    const user = typeof developer.user === "object" ? developer.user : null;
    const email = user?.email;
    if (!email) {
      skipped += 1;
      continue;
    }

    try {
      const digest = await buildDeveloperDigest(payload, { id: developer.id, name: developer.name, email }, period);
      if (!digest || (digest.totalViews === 0 && digest.totalInquiries === 0)) {
        skipped += 1;
        continue;
      }

      await payload.sendEmail({
        to: email,
        from: process.env.EMAIL_FROM,
        subject: `LankaNewHomes weekly summary — ${digest.totalViews} views, ${digest.totalInquiries} inquiries`,
        html: digestEmailHtml(digest, period, `${serverURL}/developers/dashboard`),
      });
      sent += 1;
    } catch (error) {
      console.error(`Failed to send weekly digest to developer ${developer.id}`, error);
      failed += 1;
    }
  }

  return { sent, skipped, failed };
}

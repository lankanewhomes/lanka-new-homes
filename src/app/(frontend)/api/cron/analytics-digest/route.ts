import { NextResponse } from "next/server";
import { sendWeeklyAnalyticsDigests } from "@/lib/analytics-digest";
import { recomputeAllDeveloperResponseStats } from "@/lib/response-badge";
import { sendFollowerDigests } from "@/lib/follower-digest";

// Triggered by Vercel Cron (see vercel.json — weekly, Mondays 08:00 UTC).
// Vercel signs its own cron requests with `Authorization: Bearer $CRON_SECRET`
// automatically once that env var is set on the project, so this route
// can't be triggered by anyone else. Not wired to Payload's Jobs Queue,
// since that needs a persistent process to poll it — this serverless route
// does the whole run in one invocation instead.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });

  const result = await sendWeeklyAnalyticsDigests(payload);
  // Same weekly tick re-judges every developer's "Responds within 1 hour"
  // badge, so it decays as the 90-day window slides and unanswered leads age.
  const responseBadges = await recomputeAllDeveloperResponseStats(payload).catch((error) => {
    console.error("Response badge sweep failed", error);
    return null;
  });
  // Supabase-native (no Payload instance needed) — emails buyers who follow
  // a developer about new floor plans, price changes, or construction
  // updates since last week.
  const followerDigests = await sendFollowerDigests().catch((error) => {
    console.error("Follower digest run failed", error);
    return null;
  });
  return NextResponse.json({ ...result, responseBadges, followerDigests });
}

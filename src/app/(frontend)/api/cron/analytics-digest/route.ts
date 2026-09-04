import { NextResponse } from "next/server";
import { sendWeeklyAnalyticsDigests } from "@/lib/analytics-digest";

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
  return NextResponse.json(result);
}

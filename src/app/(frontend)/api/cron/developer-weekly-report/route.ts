import { NextResponse } from "next/server";
import { sendDeveloperWeeklyReports } from "@/lib/developer-weekly-report";

// Developer weekly report (owner, 2026-11-22: "every sunday we need to send"). Called by the Cloudflare worker on Sundays at 03:30 UTC
// (9:00 am in Sri Lanka), see cloudflare/worker.js. Same auth as the other cron routes: `Authorization: Bearer $CRON_SECRET`.
// Safe to call twice: a developer who already got this week's report is skipped.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });
  const result = await sendDeveloperWeeklyReports(payload);
  return NextResponse.json(result);
}

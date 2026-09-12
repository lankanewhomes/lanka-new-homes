import { NextResponse } from "next/server";
import { expirePastDueSubscriptions } from "@/lib/subscription-expiry";

// Triggered by Vercel Cron (see vercel.json — daily). Same auth pattern as
// the weekly analytics-digest cron: Vercel signs its own cron requests with
// `Authorization: Bearer $CRON_SECRET` once that env var is set.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });

  const result = await expirePastDueSubscriptions(payload);
  return NextResponse.json(result);
}

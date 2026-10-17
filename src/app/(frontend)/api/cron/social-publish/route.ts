import { NextResponse } from "next/server";
import { runScheduledPosts } from "@/lib/social/post-custom";

// Every 5 minutes (cloudflare/worker.js CRON_ROUTES): posts the Instagram / Facebook posts scheduled in the dashboard's "Create a post" page that
// are now due. Same auth as the other cron routes: `Authorization: Bearer $CRON_SECRET`.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });
  return NextResponse.json(await runScheduledPosts(payload));
}

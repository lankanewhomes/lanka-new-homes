import { NextResponse } from "next/server";
import { runSocialSync } from "@/lib/social/import";

// Daily (cloudflare/worker.js, vercel.json): imports the LankaNewHomes Instagram and Facebook content and matches it to listings.
// Same auth as the other cron routes (Bearer CRON_SECRET).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });
  return NextResponse.json(await runSocialSync(payload));
}

import { NextResponse } from "next/server";
import { sendLeadAlerts } from "@/lib/lead-alerts";

// Safety net for lead alerts (owner, 2026-10-13). The instant alert runs inside the lead-creation request, and on Cloudflare it can be
// cut off before the email goes out (the 12 Oct Oceanista enquiry was never emailed to the developer). Every 10 minutes this finds
// recent leads that still have no alert recorded and sends it. sendLeadAlerts records an alert summary on the lead, so each lead
// is picked up once. Same auth as the other cron routes: `Authorization: Bearer $CRON_SECRET`.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });

  const now = Date.now();
  const found = await payload.find({
    collection: "leads",
    where: {
      and: [
        { createdAt: { greater_than: new Date(now - 3 * 24 * 3600 * 1000).toISOString() } },
        { createdAt: { less_than: new Date(now - 5 * 60 * 1000).toISOString() } },
        { alert_summary: { exists: false } },
      ],
    },
    sort: "createdAt",
    limit: 10,
    depth: 0,
    overrideAccess: true,
  });

  const results: { id: number | string; email: string }[] = [];
  for (const lead of found.docs) {
    const outcome = await sendLeadAlerts(payload, lead as never).catch(() => null);
    results.push({ id: lead.id, email: outcome?.email ?? "error" });
  }
  return NextResponse.json({ checked: found.docs.length, results });
}

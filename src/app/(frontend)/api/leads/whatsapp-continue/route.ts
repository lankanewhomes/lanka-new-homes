import { after, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logRawAnalyticsEvent } from "@/lib/analytics-event";
import { rateLimited } from "@/lib/rate-limit";

// The buyer who left their number in the WhatsApp dialog is now going on to WhatsApp (owner, 2026-11-09). Marks the lead as continued
// (Supabase now, the Payload copy a moment later: it is created in the background by /api/leads) and logs the "whatsapp_click"
// analytics event, which is what counts as a WhatsApp lead on the dashboards.
export async function POST(req: Request) {
  const limited = rateLimited(req, "whatsapp-continue", 60, 15 * 60 * 1000);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const projectSlug = typeof body?.projectSlug === "string" ? body.projectSlug : "";
  const leadId = typeof body?.leadId === "string" ? body.leadId : "";
  if (!projectSlug) return NextResponse.json({ error: "Missing projectSlug" }, { status: 400 });

  const now = new Date().toISOString();
  if (leadId) {
    await supabaseAdmin.from("leads").update({ whatsapp_continued_at: now }).eq("id", leadId).eq("source", "whatsapp");
    after(async () => {
      try {
        const { getPayload } = await import("payload");
        const payloadConfig = (await import("../../../../../../payload.config")).default;
        const payload = await getPayload({ config: payloadConfig });
        // The Payload lead is created in the background after /api/leads answers: wait for it a few seconds.
        for (let attempt = 0; attempt < 6; attempt++) {
          const found = await payload.find({ collection: "leads", where: { supabase_lead_id: { equals: leadId } }, limit: 1, depth: 0, overrideAccess: true });
          const lead = found.docs[0];
          if (lead) {
            await payload.update({ collection: "leads", id: lead.id, data: { whatsapp_continued_at: now } as never, overrideAccess: true, context: { skipSupabaseSync: true } });
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error("Failed to mark the lead as continued to WhatsApp", error);
      }
    });
  }

  try {
    await logRawAnalyticsEvent(req, {
      projectSlug,
      eventType: "whatsapp_click",
      sourcePage: "whatsapp-capture",
      sessionId: body.sessionId,
      trafficSource: body.trafficSource,
      utm: body.utm,
    });
  } catch (error) {
    console.error("Failed to log whatsapp_click analytics event", error);
  }
  return NextResponse.json({ ok: true });
}

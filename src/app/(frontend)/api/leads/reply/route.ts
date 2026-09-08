import { NextResponse } from "next/server";
import { isLeadReplyChannel, verifyLeadReply, type LeadReplyChannel } from "@/lib/lead-reply-links";
import { requestOrigin } from "@/lib/request-origin";
import { whatsappChatHref } from "@/lib/whatsapp";

// One-tap reply from a lead alert email (src/lib/lead-reply-links.ts).
// GET /api/leads/reply?lead=<id>&via=whatsapp|call|email&t=<token>
//   1. verify the signed token,
//   2. if the lead is still "New", move it to Contacted — the Leads
//      afterChange hook stamps first_response_at / response_minutes and
//      re-judges the developer's "Responds within 1 hour" badge,
//   3. record the tap under reply_events (admins see it on Lead activity),
//   4. forward: WhatsApp → wa.me redirect; Call / Email → a tiny page that
//      opens tel: / mailto: (a bare redirect to those schemes is unreliable
//      in mail clients) and shows the number/address as a fallback.

type AnyDoc = Record<string, unknown>;

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>body{margin:0;background:#f5f5f0;font-family:Helvetica,Arial,sans-serif;color:#1f1f1f}main{max-width:420px;margin:48px auto;padding:28px 24px;background:#fff;border-radius:8px;text-align:center}h1{font-size:20px;margin:0 0 8px}p{margin:8px 0;font-size:15px;line-height:1.5;color:#4a4a4a}a.btn{display:inline-block;margin-top:14px;padding:12px 24px;border-radius:999px;background:#f47b36;color:#fff;font-weight:700;text-decoration:none}small{display:block;margin-top:18px;color:#9a9282;font-size:12px}</style></head>
<body><main>${body}<small>Lanka<span style="color:#f47b36">New</span>Homes</small></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead") ?? "";
  const via = url.searchParams.get("via") ?? "";
  const token = url.searchParams.get("t") ?? "";

  if (!leadId || !isLeadReplyChannel(via) || !token || !verifyLeadReply(leadId, via, token)) {
    return page("Link not valid", `<h1>This reply link isn’t valid</h1><p>Open the lead in your dashboard instead.</p>`, 400);
  }

  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });

  const lead = (await payload.findByID({ collection: "leads", id: leadId, depth: 0, overrideAccess: true }).catch(() => null)) as AnyDoc | null;
  if (!lead) return page("Lead not found", `<h1>Lead not found</h1><p>It may have been deleted.</p>`, 404);

  const projectId = lead.project && typeof lead.project === "object" ? (lead.project as { id: string | number }).id : (lead.project as string | number | undefined);
  const project = projectId ? ((await payload.findByID({ collection: "projects", id: projectId, depth: 0, overrideAccess: true }).catch(() => null)) as AnyDoc | null) : null;
  const projectName = text(project?.name) || "your project";
  const buyerName = text(lead.name) || "there";
  const buyerPhone = text(lead.phone);
  const buyerEmail = text(lead.email);
  const planName = text(lead.floor_plan);

  // Record the tap (and where it came from); first tap on a "New" lead is the answer.
  const now = new Date().toISOString();
  const existingEvents = Array.isArray(lead.reply_events) ? (lead.reply_events as AnyDoc[]) : [];
  const wasNew = lead.status === "new";
  const origin = requestOrigin(req);
  await payload.update({
    collection: "leads",
    id: leadId,
    data: {
      ...(wasNew ? { status: "contacted" } : {}),
      first_reply_via: text(lead.first_reply_via) || via,
      reply_events: [...existingEvents, { via, source: "alert-email", at: now, country: origin.country || undefined, city: origin.city || undefined, device: origin.device }],
    } as never,
    overrideAccess: true,
    context: { replyVia: via, skipSupabaseSync: true },
  });

  const target = targetFor(via, { buyerPhone, buyerEmail, buyerName, projectName, planName });
  if (!target) {
    return page("No contact details", `<h1>Marked as contacted</h1><p>${buyerName} didn’t leave a ${via === "email" ? "email address" : "phone number"}, so there’s nothing to open.</p>`);
  }

  if (via === "whatsapp") return NextResponse.redirect(target, { status: 302, headers: { "Cache-Control": "no-store" } });

  const label = via === "call" ? `Calling ${buyerPhone}…` : `Opening email to ${buyerEmail}…`;
  return page(
    "Marked as contacted",
    `<h1>✓ Marked as contacted</h1><p>${label}</p><a class="btn" href="${target}">${via === "call" ? "Call now" : "Open email"}</a><script>setTimeout(function(){window.location.href=${JSON.stringify(target)}},400)</script>`,
  );
}

function targetFor(via: LeadReplyChannel, b: { buyerPhone: string; buyerEmail: string; buyerName: string; projectName: string; planName: string }): string | null {
  const opener = `Hi ${b.buyerName}, thanks for your interest in ${b.planName ? `${b.planName} at ` : ""}${b.projectName}. `;
  if (via === "whatsapp") return whatsappChatHref(b.buyerPhone, opener);
  if (via === "call") return b.buyerPhone ? `tel:${b.buyerPhone.replace(/[^+\d]/g, "")}` : null;
  if (via === "email") return b.buyerEmail ? `mailto:${encodeURIComponent(b.buyerEmail)}?subject=${encodeURIComponent(`Re: ${b.projectName}`)}&body=${encodeURIComponent(opener)}` : null;
  return null;
}

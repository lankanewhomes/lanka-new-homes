import { after } from "next/server";
import { createMailTransport } from "@/lib/mailer";
import { DEFAULT_TEST_INBOX, isProductionDeployment } from "@/lib/lead-alerts";
import {
  inboundNoticeSubject,
  parseWhatsAppWebhook,
  renderInboundNoticeHTML,
  renderInboundNoticeText,
  verifyWebhookChallenge,
  verifyWhatsAppSignature,
  type WhatsAppInboundMessage,
} from "@/lib/whatsapp-webhook";

export const dynamic = "force-dynamic";

// WhatsApp Cloud API webhook: https://www.lankanewhomes.com/api/whatsapp/webhook (Meta app → WhatsApp → Configuration).
//   GET  — Meta's one-time subscribe check; echoes hub.challenge when hub.verify_token = WHATSAPP_WEBHOOK_VERIFY_TOKEN.
//   POST — every incoming message and delivery update. Only calls signed with WHATSAPP_APP_SECRET (X-Hub-Signature-256) are
//          accepted. Each new message is emailed to the owner (WHATSAPP_INBOUND_NOTIFY_TO, else LEAD_NOTICE_TO, else
//          developers@lankanewhomes.com) after the 200 is sent, so Meta never waits on the email. Failed deliveries of our own
//          messages (lead alert templates) are logged. Setup and env: docs/design.md, "Incoming WhatsApp messages".
// Test routing: like every other email channel here, a non-production deployment sends the notice to the test inbox.

export function GET(request: Request) {
  const challenge = verifyWebhookChallenge(new URL(request.url).searchParams, process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);
  if (challenge === null) return new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
  return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

// Meta can deliver the same message more than once; remember recent ids (per worker instance) so the owner gets one email.
const recentIds = new Map<string, number>();
function isFirstDelivery(id: string): boolean {
  if (recentIds.has(id)) return false;
  recentIds.set(id, Date.now());
  if (recentIds.size > 500) {
    const oldest = recentIds.keys().next().value;
    if (oldest !== undefined) recentIds.delete(oldest);
  }
  return true;
}

export async function POST(request: Request) {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error("WhatsApp webhook: WHATSAPP_APP_SECRET is not set, so the call cannot be verified and was refused");
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await request.arrayBuffer();
  if (!(await verifyWhatsAppSignature(raw, request.headers.get("x-hub-signature-256"), appSecret))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, statuses } = parseWhatsAppWebhook(body);
  for (const status of statuses) {
    if (status.status === "failed") console.error("WhatsApp message not delivered", { id: status.id, to: status.recipient, errors: status.errors });
  }

  const fresh = messages.filter((message) => isFirstDelivery(message.id));
  if (fresh.length) after(() => emailOwner(fresh));
  return Response.json({ ok: true });
}

async function emailOwner(messages: WhatsAppInboundMessage[]): Promise<void> {
  const inbox = process.env.WHATSAPP_INBOUND_NOTIFY_TO || process.env.LEAD_NOTICE_TO || "developers@lankanewhomes.com";
  const live = isProductionDeployment();
  const to = live ? inbox : process.env.LEAD_ALERTS_OVERRIDE_TO || process.env.LEAD_ALERTS_TEST_INBOX || DEFAULT_TEST_INBOX;
  const transporter = createMailTransport();
  for (const message of messages) {
    try {
      await transporter.sendMail({
        to,
        from: process.env.EMAIL_FROM,
        subject: `${live ? "" : `[TEST — would go to ${inbox}] `}${inboundNoticeSubject(message)}`,
        html: renderInboundNoticeHTML(message),
        text: renderInboundNoticeText(message),
      });
    } catch (error) {
      console.error("WhatsApp webhook: notice email failed", { id: message.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

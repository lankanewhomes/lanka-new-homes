import { NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-cloud";
import { digitsOnly, loadRecipients, renderTemplate, sameNumber, sendWhatsAppText, WHATSAPP_TEMPLATES, WINDOW_MS, type TemplateName } from "@/lib/whatsapp-inbox";

// Admin-only backend for /dashboard/whatsapp. Reads the whatsapp-messages table; writes drafts; sends ONLY a draft the admin approved.
//   GET  ?view=conversations | thread&phone=… | recipients
//   POST { action: "draft", phone, developerId?, template, params } | { action: "draft", phone, text } | { action: "send", id } | { action: "discard", id }
// A text draft is refused unless the other person wrote to us in the last 24 hours (WhatsApp's rule); a template draft is always allowed.
export const dynamic = "force-dynamic";

type Msg = { id: number; direction: "inbound" | "outbound"; phone: string; text?: string | null; templateName?: string | null; status: string; error?: string | null; sentAt: string; developer?: number | { id: number } | null };

async function admin(request: Request) {
  const { getPayload } = await import("payload");
  const payload = await getPayload({ config: (await import("../../../../../../payload.config")).default });
  const { user } = await payload.auth({ headers: request.headers });
  if ((user as { role?: string } | null)?.role !== "admin") return null;
  return payload;
}

const COLLECTION = "whatsapp-messages";

export async function GET(request: Request) {
  const payload = await admin(request);
  if (!payload) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const db = payload as unknown as { find: (a: Record<string, unknown>) => Promise<{ docs: unknown[] }> };
  const url = new URL(request.url);
  const view = url.searchParams.get("view") ?? "conversations";

  if (view === "recipients") return NextResponse.json({ recipients: await loadRecipients(db), templates: WHATSAPP_TEMPLATES });

  if (view === "thread") {
    const phone = digitsOnly(url.searchParams.get("phone") ?? "");
    if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });
    const { docs } = await db.find({ collection: COLLECTION, where: { phone: { equals: phone } }, sort: "sentAt", limit: 500, depth: 0, overrideAccess: true });
    const messages = docs as Msg[];
    const lastInbound = [...messages].reverse().find((m) => m.direction === "inbound");
    const windowOpen = Boolean(lastInbound && Date.now() - new Date(lastInbound.sentAt).getTime() < WINDOW_MS);
    return NextResponse.json({ messages, windowOpen });
  }

  const { docs } = await db.find({ collection: COLLECTION, sort: "-sentAt", limit: 1000, depth: 0, overrideAccess: true });
  const recipients = await loadRecipients(db);
  const byPhone = new Map<string, { phone: string; last: Msg; unanswered: number; drafts: number }>();
  for (const m of docs as Msg[]) {
    const row = byPhone.get(m.phone) ?? { phone: m.phone, last: m, unanswered: 0, drafts: 0 };
    if (m.status === "draft") row.drafts += 1;
    byPhone.set(m.phone, row);
  }
  // "Unanswered" = inbound messages newer than our last outbound one in that conversation.
  const sent = (docs as Msg[]).filter((m) => m.direction === "outbound" && m.status !== "draft");
  const conversations = [...byPhone.values()].map((c) => {
    const lastOut = sent.find((m) => m.phone === c.phone);
    const unanswered = (docs as Msg[]).filter((m) => m.phone === c.phone && m.direction === "inbound" && (!lastOut || m.sentAt > lastOut.sentAt)).length;
    const who = recipients.find((r) => sameNumber(r.phone, c.phone));
    return { phone: c.phone, developerId: who?.developerId ?? null, name: who?.name ?? null, lastText: c.last.text ?? (c.last.templateName ? `Template: ${c.last.templateName}` : ""), lastAt: c.last.sentAt, lastDirection: c.last.direction, unanswered, drafts: c.drafts };
  });
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const payload = await admin(request);
  if (!payload) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const db = payload as unknown as {
    find: (a: Record<string, unknown>) => Promise<{ docs: unknown[] }>;
    findByID: (a: Record<string, unknown>) => Promise<unknown>;
    create: (a: Record<string, unknown>) => Promise<{ id: number }>;
    update: (a: Record<string, unknown>) => Promise<unknown>;
    delete: (a: Record<string, unknown>) => Promise<unknown>;
  };
  const body = (await request.json().catch(() => ({}))) as { action?: string; id?: number; phone?: string; developerId?: number; template?: string; params?: string[]; text?: string };

  if (body.action === "draft") {
    const phone = digitsOnly(body.phone ?? "");
    if (phone.length < 8 || phone.length > 15) return NextResponse.json({ error: "Enter the number with country code, e.g. 94771234567." }, { status: 400 });
    const developer = body.developerId ? { developer: body.developerId } : {};
    if (body.template) {
      const name = body.template as TemplateName;
      const def = WHATSAPP_TEMPLATES[name];
      if (!def) return NextResponse.json({ error: "Unknown template." }, { status: 400 });
      const params = (body.params ?? []).map((p) => String(p).trim());
      if (params.length !== def.params.length || params.some((p) => !p)) return NextResponse.json({ error: `Fill in all ${def.params.length} fields.` }, { status: 400 });
      const doc = await db.create({ collection: COLLECTION, overrideAccess: true, data: { direction: "outbound", phone, text: renderTemplate(name, params), messageType: "template", templateName: name, templateParams: params, status: "draft", sentAt: new Date().toISOString(), ...developer } });
      return NextResponse.json({ ok: true, id: doc.id });
    }
    const text = (body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "Write a message." }, { status: 400 });
    const { docs } = await db.find({ collection: COLLECTION, where: { and: [{ phone: { equals: phone } }, { direction: { equals: "inbound" } }] }, sort: "-sentAt", limit: 1, depth: 0, overrideAccess: true });
    const last = docs[0] as Msg | undefined;
    if (!last || Date.now() - new Date(last.sentAt).getTime() >= WINDOW_MS) return NextResponse.json({ error: "They have not written in the last 24 hours, so WhatsApp only allows an approved template." }, { status: 409 });
    const doc = await db.create({ collection: COLLECTION, overrideAccess: true, data: { direction: "outbound", phone, text, messageType: "text", status: "draft", sentAt: new Date().toISOString(), ...developer } });
    return NextResponse.json({ ok: true, id: doc.id });
  }

  if (body.action === "discard" || body.action === "send") {
    const m = (await db.findByID({ collection: COLLECTION, id: body.id, depth: 0, overrideAccess: true }).catch(() => null)) as (Msg & { templateParams?: string[] }) | null;
    if (!m || m.direction !== "outbound" || m.status !== "draft") return NextResponse.json({ error: "Only an unsent draft can be sent or discarded." }, { status: 409 });
    if (body.action === "discard") {
      await db.delete({ collection: COLLECTION, id: m.id, overrideAccess: true });
      return NextResponse.json({ ok: true });
    }
    const result = m.templateName
      ? await sendWhatsAppTemplate({ to: m.phone, bodyParams: m.templateParams ?? [], template: m.templateName, language: "en" })
      : await sendWhatsAppText(m.phone, m.text ?? "");
    if (!result.ok) {
      await db.update({ collection: COLLECTION, id: m.id, overrideAccess: true, data: { status: "failed", error: result.error.slice(0, 250) } });
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    await db.update({ collection: COLLECTION, id: m.id, overrideAccess: true, data: { status: "sent", waMessageId: result.messageId, sentAt: new Date().toISOString() } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

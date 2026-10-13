/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../../payload.config";
import { sendHumanEmail } from "@/lib/mail/send";
import { DEFAULT_TEST_INBOX, isProductionDeployment } from "@/lib/lead-alerts";
import { OUTREACH_SENDERS, OUTREACH_TEMPLATES, renderOutreachEmail, type OutreachTemplateId } from "@/lib/outreach-templates";

// Admin-only. GET = live preview of a template for an Outreach row; POST = send it (from the Outreach log panel).
export const dynamic = "force-dynamic";

const SITE = "https://www.lankanewhomes.com";
const isTemplate = (v: unknown): v is OutreachTemplateId => OUTREACH_TEMPLATES.some((t) => t.id === v);

async function load(request: Request, id: string, override?: { developerId?: string | null; projectIds?: string[] | null; leadId?: string | null }) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if ((user as any)?.role !== "admin") return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  const row = (await payload.findByID({ collection: "outreach", id, depth: 0, overrideAccess: true }).catch(() => null)) as any;
  if (!row) return { error: NextResponse.json({ error: "Save this row first." }, { status: 404 }) };
  if (override?.developerId) {
    const dev = (await payload.findByID({ collection: "developers", id: override.developerId, depth: 0, select: { name: true }, overrideAccess: true }).catch(() => null)) as any;
    if (dev) row.developerName = dev.name;
  }
  const projectIds: (number | string)[] = override?.projectIds ?? (row.projects ?? []).map((p: any) => (typeof p === "object" ? p.id : p));
  const projects = projectIds.length
    ? ((await payload.find({ collection: "projects", where: { id: { in: projectIds } }, depth: 0, limit: 20, select: { name: true, slug: true }, overrideAccess: true })).docs as any[])
    : [];
  const leadId = override?.leadId ?? (row.lead ? String(typeof row.lead === "object" ? row.lead.id : row.lead) : null);
  let lead: any = null;
  if (leadId) {
    const l = (await payload.findByID({ collection: "leads", id: leadId, depth: 0, overrideAccess: true }).catch(() => null)) as any;
    if (l) {
      const p = (await payload.findByID({ collection: "projects", id: l.project, depth: 0, select: { name: true }, overrideAccess: true }).catch(() => null)) as any;
      const o = l.origin ?? {};
      lead = { name: l.name, email: l.email, phone: l.phone, preferred: l.preferred_contact_method, message: l.message, receivedAt: l.createdAt, projectName: p?.name ?? "your listing", planName: l.floor_plan, place: [o.city, o.country].filter(Boolean).join(", ") };
    }
  }
  return { payload, row, projects, lead };
}

function render(row: any, projects: any[], lead: any, input: { template: unknown; contactName?: string; note?: string }) {
  const template = isTemplate(input.template) ? input.template : null;
  if (!template) return null;
  return renderOutreachEmail(template, {
    contactName: input.contactName,
    companyName: row.developerName,
    customNote: input.note,
    projects: projects.map((p) => ({ name: p.name, slug: p.slug })),
    lead,
    link: (path) => `${SITE}/o/${row.code}?to=${path}`,
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const loaded = await load(request, id, { leadId: url.searchParams.get("leadId") || null, developerId: url.searchParams.get("developerId"), projectIds: url.searchParams.has("projectIds") ? url.searchParams.get("projectIds")!.split(",").filter(Boolean) : null });
  if ("error" in loaded) return loaded.error;
  const email = render(loaded.row, loaded.projects, loaded.lead, { template: url.searchParams.get("template"), contactName: url.searchParams.get("contactName") ?? "", note: url.searchParams.get("note") ?? "" });
  if (!email) return NextResponse.json({ error: "Pick a template." }, { status: 400 });
  return NextResponse.json({ subject: email.subject, html: email.html, live: isProductionDeployment() });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const loaded = await load(request, id, { leadId: body.leadId ? String(body.leadId) : null, developerId: body.developerId ? String(body.developerId) : null, projectIds: Array.isArray(body.projectIds) ? body.projectIds.map(String) : null });
  if ("error" in loaded) return loaded.error;
  const { payload, row, projects, lead } = loaded;
  const to = typeof body.toEmail === "string" ? body.toEmail.trim() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ error: "Enter a valid email address to send to." }, { status: 400 });
  const from = OUTREACH_SENDERS.find((s) => s.value === body.fromAddress)?.value ?? OUTREACH_SENDERS[0].value;
  const email = render(row, projects, lead, { template: body.template, contactName: body.contactName, note: body.customNote });
  if (!email) return NextResponse.json({ error: "Pick a template." }, { status: 400 });

  // Same guard as every other outbound channel: a local/preview session never reaches a real inbox.
  const live = isProductionDeployment();
  // Live sends go through the Zoho mailbox (so they show in Zoho's Sent folder and /cms/mail); tests and local sessions use Resend and the test inbox.
  const sent = live
    ? await sendHumanEmail({ from, fromName: "LankaNewHomes", to, copyToSender: true, subject: email.subject, html: email.html, text: email.text })
    : await sendHumanEmail({ from, fromName: "LankaNewHomes", to: DEFAULT_TEST_INBOX, forceResend: true, subject: `[TEST — not sent to ${to}] ${email.subject}`, html: email.html, text: email.text });

  await payload.update({
    collection: "outreach",
    id: row.id,
    overrideAccess: true,
    data: {
      ...(body.developerId ? { developer: Number(body.developerId) } : {}),
      ...(body.leadId ? { lead: Number(body.leadId) } : {}),
      ...(Array.isArray(body.projectIds) ? { projects: body.projectIds.map(Number) } : {}),
      template: body.template,
      contactName: body.contactName ?? null,
      toEmail: to,
      fromAddress: from,
      customNote: body.customNote ?? null,
      subject: email.subject,
      sentHtml: email.html,
      recipient: `${body.contactName ? `${body.contactName} ` : ""}(${to})`,
      channel: sent.via === "zoho" ? "zoho" : "resend",
      resendId: sent.via === "resend" ? (sent.id ?? null) : null,
      ...(live ? { status: "sent", sentAt: new Date().toISOString() } : {}),
    } as never,
  });
  return NextResponse.json({ ok: true, live, sentTo: live ? to : DEFAULT_TEST_INBOX, id: sent.id });
}

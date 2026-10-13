/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../../payload.config";
import { sendMail } from "@/lib/mailer";
import { DEFAULT_TEST_INBOX, isProductionDeployment } from "@/lib/lead-alerts";
import { OUTREACH_SENDERS, OUTREACH_TEMPLATES, renderOutreachEmail, type OutreachTemplateId } from "@/lib/outreach-templates";

// Admin-only. GET = live preview of a template for an Outreach row; POST = send it (from the Outreach log panel).
export const dynamic = "force-dynamic";

const SITE = "https://www.lankanewhomes.com";
const isTemplate = (v: unknown): v is OutreachTemplateId => OUTREACH_TEMPLATES.some((t) => t.id === v);

async function load(request: Request, id: string) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if ((user as any)?.role !== "admin") return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  const row = (await payload.findByID({ collection: "outreach", id, depth: 0, overrideAccess: true }).catch(() => null)) as any;
  if (!row) return { error: NextResponse.json({ error: "Save this row first." }, { status: 404 }) };
  const projectIds: number[] = (row.projects ?? []).map((p: any) => (typeof p === "object" ? p.id : p));
  const projects = projectIds.length
    ? ((await payload.find({ collection: "projects", where: { id: { in: projectIds } }, depth: 0, limit: 20, select: { name: true, slug: true }, overrideAccess: true })).docs as any[])
    : [];
  return { payload, row, projects };
}

function render(row: any, projects: any[], input: { template: unknown; contactName?: string; note?: string }) {
  const template = isTemplate(input.template) ? input.template : null;
  if (!template) return null;
  return renderOutreachEmail(template, {
    contactName: input.contactName,
    companyName: row.developerName,
    customNote: input.note,
    projects: projects.map((p) => ({ name: p.name, slug: p.slug })),
    link: (path) => `${SITE}/o/${row.code}?to=${path}`,
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(request, id);
  if ("error" in loaded) return loaded.error;
  const url = new URL(request.url);
  const email = render(loaded.row, loaded.projects, { template: url.searchParams.get("template"), contactName: url.searchParams.get("contactName") ?? "", note: url.searchParams.get("note") ?? "" });
  if (!email) return NextResponse.json({ error: "Pick a template." }, { status: 400 });
  return NextResponse.json({ subject: email.subject, html: email.html, live: isProductionDeployment() });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await load(request, id);
  if ("error" in loaded) return loaded.error;
  const { payload, row, projects } = loaded;
  const body = await request.json().catch(() => ({}));
  const to = typeof body.toEmail === "string" ? body.toEmail.trim() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return NextResponse.json({ error: "Enter a valid email address to send to." }, { status: 400 });
  const from = OUTREACH_SENDERS.find((s) => s.value === body.fromAddress)?.value ?? OUTREACH_SENDERS[0].value;
  const email = render(row, projects, { template: body.template, contactName: body.contactName, note: body.customNote });
  if (!email) return NextResponse.json({ error: "Pick a template." }, { status: 400 });

  // Same guard as every other outbound channel: a local/preview session never reaches a real inbox.
  const live = isProductionDeployment();
  const sent = await sendMail({
    to: live ? to : DEFAULT_TEST_INBOX,
    from: `LankaNewHomes <${from}>`,
    replyTo: from,
    bcc: live ? from : undefined,
    subject: `${live ? "" : `[TEST — not sent to ${to}] `}${email.subject}`,
    html: email.html,
    text: email.text,
  });

  await payload.update({
    collection: "outreach",
    id: row.id,
    overrideAccess: true,
    data: {
      template: body.template,
      contactName: body.contactName ?? null,
      toEmail: to,
      fromAddress: from,
      customNote: body.customNote ?? null,
      subject: email.subject,
      recipient: `${body.contactName ? `${body.contactName} ` : ""}(${to})`,
      channel: "resend",
      resendId: sent.id ?? null,
      ...(live ? { status: "sent", sentAt: new Date().toISOString() } : {}),
    } as never,
  });
  return NextResponse.json({ ok: true, live, sentTo: live ? to : DEFAULT_TEST_INBOX, id: sent.id });
}

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { DEFAULT_TEST_INBOX, isProductionDeployment } from "@/lib/lead-alerts";

const AUDIENCE_LABELS: Record<string, string> = {
  general: "General inquiries",
  founder: "Founder (Rupan)",
  developer: "Developer partnerships",
};

// The /contact page's own general-inquiry form — not tied to a project/lead,
// so it doesn't go through Payload's leads collection at all; it's a plain
// email, same transport (`SMTP_*`) and `EMAIL_FROM` Payload's own adapter
// and the follower-digest cron already use. Always sent to the monitored
// support inbox — the "who are you trying to reach" answer is included in
// the subject/body so the team routes it by hand, rather than splitting
// delivery across several real inboxes. Reply-To is the visitor's own
// address, so replying from the inbox goes straight back to them.
//
// Test routing reuses the exact same non-production guard as every other
// alert channel on the site (lead alerts, the follower digest, saved-search
// alerts) — a local/preview submission can never reach the real inbox. See
// feedback memory "lead-alert-test-routing": never assume a new channel is
// exempt from this.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const company = typeof body?.company === "string" ? body.company.trim() : "";
    const jobTitle = typeof body?.jobTitle === "string" ? body.jobTitle.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const audience = typeof body?.audience === "string" ? body.audience.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const updatesOptIn = body?.updatesOptIn === true;

    if (!firstName || !lastName || !email || !audience || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const name = `${firstName} ${lastName}`.trim();
    const audienceLabel = AUDIENCE_LABELS[audience] ?? audience;

    const isTest = !isProductionDeployment();
    const testInbox = process.env.LEAD_ALERTS_OVERRIDE_TO || process.env.LEAD_ALERTS_TEST_INBOX || DEFAULT_TEST_INBOX;
    const to = isTest ? testInbox : "support@lankanewhomes.com";

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const detailLines = [
      `Reaching: ${audienceLabel}`,
      company ? `Company: ${company}` : null,
      jobTitle ? `Role: ${jobTitle}` : null,
      `Updates opt-in: ${updatesOptIn ? "yes" : "no"}`,
    ].filter((line): line is string => Boolean(line));

    await transporter.sendMail({
      to,
      from: process.env.EMAIL_FROM,
      replyTo: email,
      subject: `${isTest ? `[TEST — would go to support@lankanewhomes.com] ` : ""}Contact form (${audienceLabel}): ${name}`,
      html: `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) sent a message from the /contact form:</p><p>${detailLines.map(escapeHtml).join("<br>")}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      text: `${name} (${email}) sent a message from the /contact form:\n\n${detailLines.join("\n")}\n\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send /contact form submission", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string);
}

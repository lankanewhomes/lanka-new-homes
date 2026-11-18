import { NextResponse } from "next/server";
import { createMailTransport } from "@/lib/mailer";
import { DEFAULT_TEST_INBOX, isProductionDeployment } from "@/lib/lead-alerts";
import { rateLimited } from "@/lib/rate-limit";

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
  const limited = rateLimited(req, "contact", 10, 15 * 60 * 1000); // each send is an email to the team inbox
  if (limited) return limited;
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const company = typeof body?.company === "string" ? body.company.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const audience = typeof body?.audience === "string" ? body.audience.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const allowed = ["newsletter", "news", "listings", "launches"];
    const interests = Array.isArray(body?.interests) ? body.interests.filter((v: unknown): v is string => typeof v === "string" && allowed.includes(v)) : [];
    const updatesOptIn = body?.updatesOptIn === true || interests.length > 0;

    if (!name || !email || !audience || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const audienceLabel = AUDIENCE_LABELS[audience] ?? audience;

    // Save the signup (live site only; local and preview submissions never write to the real list). Never blocks the message.
    if (interests.length && isProductionDeployment()) {
      try {
        const { getPayload } = await import("payload");
        const payloadConfig = (await import("../../../../../payload.config")).default;
        const payload = await getPayload({ config: payloadConfig });
        const found = await payload.find({ collection: "subscribers", where: { email: { equals: email.toLowerCase() } }, limit: 1, depth: 0 });
        const existing = found.docs[0];
        const merged = Array.from(new Set([...(existing?.interests ? existing.interests.split(", ") : []), ...interests])).join(", ");
        if (existing) await payload.update({ collection: "subscribers", id: existing.id, data: { interests: merged, name: existing.name || name, status: "subscribed" } });
        else await payload.create({ collection: "subscribers", data: { email: email.toLowerCase(), name, interests: merged, source: "contact-form", status: "subscribed" } });
      } catch (error) {
        console.error("Subscriber save failed:", error instanceof Error ? error.message : error);
      }
    }

    const isTest = !isProductionDeployment();
    const testInbox = process.env.LEAD_ALERTS_OVERRIDE_TO || process.env.LEAD_ALERTS_TEST_INBOX || DEFAULT_TEST_INBOX;
    const to = isTest ? testInbox : "developers@lankanewhomes.com";

    const transporter = createMailTransport();

    const detailLines = [
      `Reaching: ${audienceLabel}`,
      company ? `Company: ${company}` : null,
      phone ? `Phone: ${phone}` : null,
      `Updates opt-in: ${updatesOptIn ? (interests.length ? `yes (${interests.join(", ")})` : "yes") : "no"}`,
    ].filter((line): line is string => Boolean(line));

    await transporter.sendMail({
      to,
      from: process.env.EMAIL_FROM,
      replyTo: email,
      subject: `${isTest ? `[TEST — would go to developers@lankanewhomes.com] ` : ""}Contact form (${audienceLabel}): ${name}`,
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

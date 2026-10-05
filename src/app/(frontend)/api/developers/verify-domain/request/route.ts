/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../../../payload.config";
import { DEFAULT_TEST_INBOX, isProductionDeployment } from "@/lib/lead-alerts";
import {
  VERIFY_RESEND_COOLDOWN_MS,
  VERIFY_TOKEN_TTL_MS,
  checkEmailAgainstWebsite,
  newVerifyToken,
  renderDomainVerificationEmailHTML,
  websiteDomain,
} from "@/lib/developer-domain-verification";

// Signed-in developer only. Their company profile = the developers row linked to their account.
async function ownDeveloper(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) return { payload, error: NextResponse.json({ error: "Sign in to your developer account first." }, { status: 401 }) };
  const found = await payload.find({ collection: "developers", where: { user: { equals: user.id } }, limit: 1, depth: 0, overrideAccess: true });
  const developer = found.docs[0] as any;
  if (!developer) return { payload, error: NextResponse.json({ error: "Your account isn't linked to a company profile yet." }, { status: 404 }) };
  return { payload, developer };
}

/** Current status for the /cms panel. */
export async function GET(request: Request) {
  const { developer, error } = await ownDeveloper(request);
  if (error) return error;
  return NextResponse.json({
    verified: Boolean(developer.domain_verified),
    verifiedDomain: developer.verified_domain ?? null,
    websiteDomain: websiteDomain(developer.website),
    pending: Boolean(developer.verify_token_hash && developer.verify_expires && new Date(developer.verify_expires).getTime() > Date.now()),
  });
}

/** Send the single-use confirmation link to an email on the company's own website domain. */
export async function POST(request: Request) {
  const { payload, developer, error } = await ownDeveloper(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const check = checkEmailAgainstWebsite(email, developer.website);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });

  const last = developer.verify_last_sent ? new Date(developer.verify_last_sent).getTime() : 0;
  if (Date.now() - last < VERIFY_RESEND_COOLDOWN_MS) {
    return NextResponse.json({ error: "A link was just sent. Wait a minute before asking for another." }, { status: 429 });
  }

  const { token, hash } = newVerifyToken();
  await payload.update({
    collection: "developers",
    id: developer.id,
    data: {
      verify_token_hash: hash,
      verify_expires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
      verify_pending_email: email,
      verify_last_sent: new Date().toISOString(),
    } as any,
    overrideAccess: true,
  });

  const serverURL = payload.config.serverURL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.lankanewhomes.com";
  const confirmUrl = `${serverURL}/developers/verify?token=${token}`;
  // Same non-production guard as every other outbound channel: a local/preview request never reaches a real inbox.
  const live = isProductionDeployment();
  await payload.sendEmail({
    to: live ? email : DEFAULT_TEST_INBOX,
    from: process.env.EMAIL_FROM,
    replyTo: "developers@lankanewhomes.com",
    subject: `${live ? "" : `[TEST — not sent to ${email}] `}Confirm your company email on LankaNewHomes`,
    html: renderDomainVerificationEmailHTML({ companyName: String(developer.name ?? "your company"), domain: check.domain, confirmUrl }),
    text: `Confirm that you own an email address at ${check.domain} to add the Verified builder badge to ${developer.name} on LankaNewHomes:\n\n${confirmUrl}\n\nThis link works once and expires in 24 hours. If you didn't ask for this, ignore this email.`,
  });

  return NextResponse.json({ ok: true, sentTo: live ? email : "the test inbox (non-production)" });
}

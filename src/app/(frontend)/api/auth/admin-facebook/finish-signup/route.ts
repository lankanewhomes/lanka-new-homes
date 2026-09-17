import { NextResponse } from "next/server";
import { mintPayloadSessionCookie } from "@/collections/auth/mint-session";

// Completes a Facebook-started developer signup once the one missing field
// (company name) is provided — see callback/route.ts for why this exists.
// Creates the account already verified (Facebook's own login already proved
// the email is real — the same reasoning normal signup's email-confirmation
// link exists to establish) and logs straight in, matching how a normal
// signup would eventually land in /cms after confirming their email, minus
// the extra round trip.
export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const pendingRaw = cookieHeader.match(/pending_facebook_signup=([^;]+)/)?.[1];
  if (!pendingRaw) {
    return NextResponse.json({ error: "Your Facebook sign-in session expired. Please try Continue with Facebook again." }, { status: 400 });
  }

  let pending: { email?: string; name?: string };
  try {
    pending = JSON.parse(Buffer.from(decodeURIComponent(pendingRaw), "base64url").toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Your Facebook sign-in session expired. Please try Continue with Facebook again." }, { status: 400 });
  }

  const email = pending.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Your Facebook sign-in session expired. Please try Continue with Facebook again." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const companyName = typeof body?.company_name === "string" ? body.company_name.trim() : "";
  if (!companyName) {
    return NextResponse.json({ error: "Company name is required." }, { status: 400 });
  }

  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });

  // Guard against a race (e.g. they signed up normally in another tab while
  // this form was open) rather than creating a duplicate account.
  const { docs: existing } = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existing[0]) {
    return NextResponse.json({ error: `An account already exists for ${email}. Try Continue with Facebook again to log in instead.` }, { status: 409 });
  }

  const user = await payload.create({
    collection: "users",
    data: {
      email,
      // Random, never shown or emailed — this account only ever signs in
      // via Facebook. A user who later wants password login can use
      // "Forgot password" to set a real one.
      password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
      full_name: pending.name?.trim() || email,
      role: "developer",
      company_name: companyName,
    },
    overrideAccess: true,
    disableVerificationEmail: true,
  });
  // Same technique as scripts/backfill-verified.ts — _verified is a
  // Payload-injected auth field, not one of Users.ts's own, so it's set via
  // a follow-up update rather than create's data.
  await payload.update({ collection: "users", id: user.id, data: { _verified: true }, overrideAccess: true });

  const cookie = await mintPayloadSessionCookie(payload, { id: user.id, email: user.email });
  const response = NextResponse.json({ ok: true });
  // response.cookies.set()/.delete() internally does headers.delete("set-cookie")
  // then re-appends only the cookies *it* knows about (parsed from headers at
  // the ResponseCookies instance's construction time, i.e. before this route
  // ever runs) — so a raw headers.append("Set-Cookie", ...) done *before* a
  // .cookies.set() call gets silently wiped. Clear the short-lived cookie
  // first, then append the real session cookie last so nothing erases it.
  response.cookies.set("pending_facebook_signup", "", { maxAge: 0, path: "/" });
  response.headers.append("Set-Cookie", cookie);
  return response;
}

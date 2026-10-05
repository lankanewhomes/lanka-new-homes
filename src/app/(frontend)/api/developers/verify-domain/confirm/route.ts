/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../../../payload.config";
import { emailDomain, hashToken } from "@/lib/developer-domain-verification";

// POST (from the /developers/verify page's button), not GET, so an email scanner that pre-fetches links can't use up
// the single-use token.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!/^[0-9a-f]{64}$/.test(token)) return NextResponse.json({ error: "This link isn't valid." }, { status: 400 });

  const payload = await getPayload({ config });
  const found = await payload.find({ collection: "developers", where: { verify_token_hash: { equals: hashToken(token) } }, limit: 1, depth: 0, overrideAccess: true });
  const developer = found.docs[0] as any;
  if (!developer || !developer.verify_expires || new Date(developer.verify_expires).getTime() < Date.now()) {
    return NextResponse.json({ error: "This link has expired or was already used. Ask for a new one from your company profile." }, { status: 410 });
  }

  const email = String(developer.verify_pending_email ?? "");
  await payload.update({
    collection: "developers",
    id: developer.id,
    data: {
      domain_verified: true,
      verified_email: email,
      verified_domain: emailDomain(email),
      verified_at: new Date().toISOString(),
      verify_token_hash: null,
      verify_expires: null,
      verify_pending_email: null,
    } as any,
    overrideAccess: true,
  });
  return NextResponse.json({ ok: true, slug: developer.slug, name: developer.name });
}

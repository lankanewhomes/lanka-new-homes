import { NextResponse } from "next/server";
import { rateLimited } from "@/lib/rate-limit";
import { verifyUnsubscribe } from "@/lib/unsubscribe";

// Unsubscribes one email from everything we send (newsletters, news, new listings, launch offers). The email + token come from the link in
// the email. A person who was never in the list still gets a row marked "unsubscribed", so a later import or send can never email them.
// Accepts the page's JSON POST and a mail app's one-click POST (token in the query string).
export async function POST(req: Request) {
  const limited = rateLimited(req, "unsubscribe", 20, 15 * 60 * 1000);
  if (limited) return limited;
  try {
    const url = new URL(req.url);
    let email = url.searchParams.get("e") ?? "";
    let token = url.searchParams.get("t") ?? "";
    if ((req.headers.get("content-type") ?? "").includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.email === "string") email = body.email;
      if (typeof body?.token === "string") token = body.token;
    }
    email = email.trim().toLowerCase();
    if (!(await verifyUnsubscribe(email, token))) return NextResponse.json({ error: "This link is not valid." }, { status: 400 });

    const { getPayload } = await import("payload");
    const payloadConfig = (await import("../../../../../payload.config")).default;
    const payload = await getPayload({ config: payloadConfig });
    const found = await payload.find({ collection: "subscribers", where: { email: { equals: email } }, limit: 1, depth: 0 });
    const existing = found.docs[0];
    if (existing) await payload.update({ collection: "subscribers", id: existing.id, data: { status: "unsubscribed" } });
    else await payload.create({ collection: "subscribers", data: { email, status: "unsubscribed", source: "unsubscribe-link" } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unsubscribe failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

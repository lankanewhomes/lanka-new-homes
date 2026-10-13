/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import { requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

// GET ?email=: does this address match a lead, developer or user in the CMS? Used for the small "also in your CMS" card.
export async function GET(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const email = (new URL(request.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return Response.json({ matches: [] });
  const { payload } = auth;
  const find = (collection: string, where: any, limit = 3) => payload.find({ collection: collection as never, where, limit, depth: 0, overrideAccess: true }).then((r) => r.docs as any[]).catch(() => []);
  const [leads, developers, users, companies] = await Promise.all([
    find("leads", { email: { equals: email } }),
    find("developers", { or: [{ contact_email: { equals: email } }, { "lead_alerts.email": { equals: email } }] }),
    find("users", { email: { equals: email } }, 1),
    find("sales-companies", { contact_email: { equals: email } }, 1),
  ]);
  const matches = [
    ...leads.map((l) => ({ kind: "Lead", label: `${l.name}${l.source ? ` · ${l.source.replace("_", " ")}` : ""}`, href: `/cms/collections/leads/${l.id}` })),
    ...developers.map((d) => ({ kind: "Developer", label: d.name, href: `/cms/collections/developers/${d.id}` })),
    ...users.map((u) => ({ kind: "User", label: `${u.name ?? u.email} (${u.role ?? "user"})`, href: `/cms/collections/users/${u.id}` })),
    ...companies.map((c) => ({ kind: "Sales company", label: c.name, href: `/cms/collections/sales-companies/${c.id}` })),
  ];
  return Response.json({ matches });
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs and raw rows are loosely typed here */
import { mapRow, poolOf, requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

const OWN_DOMAIN = "lankanewhomes.com";
const FREE = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "googlemail.com", "ymail.com", "protonmail.com"]);

// GET ?developerId=: every cached email (all mailboxes) to or from this developer. A developer is matched by the addresses on their
// profile (contact email, lead-alert email and CCs, emails already used in the Outreach log) and by their company email domain.
export async function GET(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const { payload } = auth;
  const id = Number(new URL(request.url).searchParams.get("developerId"));
  if (!id) return Response.json({ messages: [], addresses: [], domains: [] });

  const dev = (await payload.findByID({ collection: "developers", id, depth: 0, overrideAccess: true }).catch(() => null)) as any;
  if (!dev) return Response.json({ error: "Developer not found." }, { status: 404 });
  const outreach = await payload.find({ collection: "outreach" as never, where: { developer: { equals: id } } as never, limit: 100, depth: 0, overrideAccess: true }).then((r) => r.docs as any[]).catch(() => []);

  const norm = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
  const addresses = [...new Set([dev.contact_email, dev.lead_alerts?.email, ...(dev.lead_alerts?.cc ?? []), dev.verified_email, ...outreach.map((o) => o.to_email)].map(norm).filter((e) => e.includes("@") && !e.endsWith(`@${OWN_DOMAIN}`)))];
  const domains = new Set<string>();
  for (const a of addresses) {
    const d = a.split("@")[1];
    if (d && !FREE.has(d)) domains.add(d);
  }
  try {
    if (dev.website) domains.add(new URL(/^https?:/i.test(dev.website) ? dev.website : `https://${dev.website}`).hostname.replace(/^www\./, "").toLowerCase());
  } catch {}
  for (const d of dev.extra_email_domains ?? []) {
    const v = norm(typeof d === "string" ? d : d?.domain);
    if (v) domains.add(v);
  }
  domains.delete(OWN_DOMAIN);
  const doms = [...domains];
  if (!addresses.length && !doms.length) return Response.json({ messages: [], addresses, domains: doms });

  const res = await poolOf(payload).query(
    `select m.id, m.account_id, m.folder_id, m.zoho_message_id, m.thread_id, m.from_name, m.from_email, m.to_addresses, m.cc_addresses, m.bcc_addresses, m.subject, m.snippet, m.has_attachments, m.is_read, m.is_starred, m.received_at, f.type::text as folder_type, a.email as account_email
       from payload.mail_messages m join payload.mail_folders f on f.id = m.folder_id join payload.mail_accounts a on a.id = m.account_id
      where f.type::text not in ('drafts', 'spam', 'trash')
        and ( lower(m.from_email) = any($1::text[]) or split_part(lower(m.from_email), '@', 2) = any($2::text[])
          or exists (select 1 from jsonb_array_elements(coalesce(m.to_addresses, '[]'::jsonb) || coalesce(m.cc_addresses, '[]'::jsonb)) e
                      where lower(e->>'email') = any($1::text[]) or split_part(lower(e->>'email'), '@', 2) = any($2::text[])) )
      order by m.received_at desc limit 200`,
    [addresses, doms],
  );
  const messages = res.rows.map((r) => ({ ...mapRow(r), accountEmail: r.account_email as string, direction: String(r.from_email ?? "").toLowerCase().endsWith(`@${OWN_DOMAIN}`) ? "sent" : "received" }));
  return Response.json({ messages, addresses, domains: doms });
}

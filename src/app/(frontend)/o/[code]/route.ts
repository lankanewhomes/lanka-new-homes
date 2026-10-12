import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../payload.config";

// Tracked link used in outreach emails (see src/collections/Outreach.ts): /o/<code>?to=/some/path
// Records the click on the outreach row, then redirects to that path on this site. Only same-site paths are allowed,
// so the link can't be used as an open redirect. A database hiccup never blocks the redirect.
export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|preview|scanner|safelinks|proofpoint|mimecast|barracuda|headless/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const raw = request.nextUrl.searchParams.get("to") ?? "/";
  const path = raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/";

  const target = new URL(path, request.nextUrl.origin);
  target.searchParams.set("utm_source", "outreach");
  target.searchParams.set("utm_medium", "email");
  target.searchParams.set("utm_campaign", code);

  if (/^[a-z0-9]{4,32}$/i.test(code) && !BOT.test(request.headers.get("user-agent") ?? "")) {
    try {
      await Promise.race([
        (async () => {
          const payload = await getPayload({ config });
          // Straight SQL instead of payload.update(): the Outreach row has relationship and array fields, and a full update is
          // ~10 s over the remote database. One statement bumps the counters and appends the click.
          const pool = (payload.db as unknown as { pool: { query: (text: string, values: unknown[]) => Promise<unknown> } }).pool;
          await pool.query(
            `with u as (
               update payload.outreach
                  set click_count = coalesce(click_count, 0) + 1,
                      first_clicked_at = coalesce(first_clicked_at, now()),
                      last_clicked_at = now(),
                      status = case when status::text in ('draft', 'sent') then 'clicked' else status end
                where code = $1
            returning id)
             insert into payload.outreach_click_log (_order, _parent_id, id, "to", at)
             select coalesce((select max(_order) + 1 from payload.outreach_click_log where _parent_id = u.id), 1), u.id, $2, $3, now() from u`,
            [code, crypto.randomUUID().replace(/-/g, "").slice(0, 24), path],
          );
        })(),
        new Promise((resolve) => setTimeout(resolve, 6000)),
      ]);
    } catch (error) {
      console.error("outreach click not recorded:", error instanceof Error ? error.message : error);
    }
  }
  return NextResponse.redirect(target, 302);
}

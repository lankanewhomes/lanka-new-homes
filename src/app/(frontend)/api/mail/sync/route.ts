import { getMailProvider, isMockMode } from "@/lib/mail";
import { requireMailAdmin } from "@/lib/mail/server";
import { runSync } from "@/lib/mail/sync";
import { getPayload } from "payload";
import config from "../../../../../../payload.config";

export const dynamic = "force-dynamic";

// POST: incremental Zoho -> CMS sync. Called every few minutes by cron with the secret header (x-mail-sync-secret: $MAIL_SYNC_SECRET,
// or the existing Authorization: Bearer $CRON_SECRET that Vercel Cron sends), and by the Refresh button with an admin session.
// A mailbox whose full import is not finished continues importing instead (resumable batches), so the same cron also finishes it.
export async function POST(request: Request) {
  const secret = process.env.MAIL_SYNC_SECRET;
  const cron = process.env.CRON_SECRET;
  const headerOk = Boolean(secret && request.headers.get("x-mail-sync-secret") === secret) || Boolean(cron && request.headers.get("authorization") === `Bearer ${cron}`);
  let payload;
  if (headerOk) payload = await getPayload({ config });
  else {
    const auth = await requireMailAdmin(request);
    if ("error" in auth) return auth.error;
    payload = auth.payload;
  }
  // Scheduled runs never touch the database while the mock client is active (sample data is only for the admin's own testing).
  if (headerOk && isMockMode()) return Response.json({ skipped: "Mock mode is on, so the scheduled sync does nothing." });
  const accountEmail = new URL(request.url).searchParams.get("account") ?? undefined;
  try {
    const report = await runSync(payload, await getMailProvider(), { mode: "auto", budgetMs: 20_000, accountEmail });
    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Sync failed." }, { status: 502 });
  }
}

// Cron services that can only send GET (some uptime pingers) may use GET with the secret header too.
export const GET = POST;

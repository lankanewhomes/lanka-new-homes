import { after } from "next/server";
import { getPayload } from "payload";
import { getMailProvider, isMockMode } from "@/lib/mail";
import { runSync } from "@/lib/mail/sync";
import config from "../../../../../../payload.config";

export const dynamic = "force-dynamic";

// POST /api/mail/webhook?secret=$MAIL_SYNC_SECRET: optional Zoho Mail outgoing webhook (new incoming mail) that triggers an
// instant incremental sync instead of waiting for the next cron run. Answers right away and syncs after the response.
export async function POST(request: Request) {
  const secret = process.env.MAIL_SYNC_SECRET;
  const given = new URL(request.url).searchParams.get("secret") ?? request.headers.get("x-mail-sync-secret");
  if (!secret || given !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (isMockMode()) return Response.json({ skipped: "Mock mode is on." });
  after(async () => {
    try {
      const payload = await getPayload({ config });
      await runSync(payload, await getMailProvider(), { mode: "incremental", budgetMs: 20_000 });
    } catch (error) {
      console.error("mail webhook sync failed", error instanceof Error ? error.message : error);
    }
  });
  return Response.json({ ok: true }, { status: 202 });
}

import { getMailProvider, isMockMode, MAILBOX_ENV, zohoCredentialsPresent } from "@/lib/mail";
import { requireMailAdmin } from "@/lib/mail/server";
import { getSyncStatus } from "@/lib/mail/sync";

export const dynamic = "force-dynamic";

const ENV_KEYS = [
  "MAIL_MOCK_MODE", "ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN", "ZOHO_ACCOUNTS_URL", "ZOHO_MAIL_API_URL", ...MAILBOX_ENV.map((m) => m.env), "MAIL_SYNC_SECRET",
  // Optional: separate keys per mailbox when each mailbox is its own Zoho login.
  ...MAILBOX_ENV.flatMap((m) => [`ZOHO_CLIENT_ID_${m.suffix}`, `ZOHO_CLIENT_SECRET_${m.suffix}`, `ZOHO_REFRESH_TOKEN_${m.suffix}`]),
];

// GET: connection status for /cms/mail/settings. Never returns env values, only whether each key is set. ?test=1 also calls the provider.
export async function GET(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const test = new URL(request.url).searchParams.get("test") === "1";
  let connection: { ok: boolean; message: string; accounts: { email: string; zohoAccountId: string }[] } | null = null;
  if (test) {
    try {
      const result = await (await getMailProvider()).testConnection();
      connection = { ok: result.ok, message: result.message, accounts: result.accounts.map((a) => ({ email: a.email, zohoAccountId: a.zohoAccountId })) };
    } catch (error) {
      connection = { ok: false, message: error instanceof Error ? error.message : "Connection test failed.", accounts: [] };
    }
  }
  return Response.json({
    mock: isMockMode(),
    credentialsPresent: zohoCredentialsPresent(),
    env: ENV_KEYS.map((key) => ({ key, set: Boolean(process.env[key]) })),
    connection,
    sync: await getSyncStatus(auth.payload),
  });
}

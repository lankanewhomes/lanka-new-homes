/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import { ensureAccounts, syncFolders } from "@/lib/mail/sync";
import { folderCounts, providerContext, requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

// Mailboxes + their folders with live unread/total counts. On first use it creates the mailbox rows and reads the folder list
// from the provider (cheap); the messages themselves arrive through /api/mail/import.
export async function GET(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const { payload } = auth;
  const { provider, mock } = await providerContext(payload);

  let accounts = (await payload.find({ collection: "mail-accounts", where: { active: { not_equals: false } }, limit: 20, depth: 0, pagination: false, overrideAccess: true })).docs as any[];
  let warnings: string[] = [];
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  if (accounts.length < 3 || refresh) {
    const ensured = await ensureAccounts(payload, provider);
    warnings = ensured.warnings;
    for (const a of ensured.accounts) await syncFolders(payload, provider, a);
    accounts = (await payload.find({ collection: "mail-accounts", where: { active: { not_equals: false } }, limit: 20, depth: 0, pagination: false, overrideAccess: true })).docs as any[];
  }
  const folders = (await payload.find({ collection: "mail-folders", limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as any[];
  const counts = await folderCounts(payload);
  const states = (await payload.find({ collection: "mail-sync-state", where: { zohoFolderId: { exists: true } }, limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as any[];
  const pendingImport = states.length === 0 || states.some((s) => s.importStatus !== "complete");

  return Response.json({
    mock,
    pendingImport,
    warnings,
    accounts: accounts.map((a) => ({
      id: a.id, email: a.email, displayName: a.displayName ?? a.email, color: a.color ?? "#2563eb", signature: a.signature ?? "", zohoAccountId: a.zohoAccountId ?? "",
      folders: folders
        .filter((f) => (typeof f.account === "object" ? f.account.id : f.account) === a.id)
        .map((f) => ({ id: f.id, zohoFolderId: f.zohoFolderId, name: f.name, type: f.type, unread: counts.get(f.id)?.unread ?? 0, total: counts.get(f.id)?.total ?? 0 })),
    })),
  });
}

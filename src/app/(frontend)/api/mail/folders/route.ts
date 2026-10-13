import { folderCounts, requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

// GET ?accountId=: the folders of a mailbox (or all mailboxes) with live unread / total counts.
export async function GET(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const accountId = Number(new URL(request.url).searchParams.get("accountId")) || undefined;
  const folders = (await auth.payload.find({ collection: "mail-folders", where: accountId ? { account: { equals: accountId } } : undefined, limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs;
  const counts = await folderCounts(auth.payload);
  return Response.json({
    folders: folders.map((f) => ({ id: f.id, accountId: typeof f.account === "object" ? f.account.id : f.account, zohoFolderId: f.zohoFolderId, name: f.name, type: f.type, unread: counts.get(f.id)?.unread ?? 0, total: counts.get(f.id)?.total ?? 0 })),
  });
}

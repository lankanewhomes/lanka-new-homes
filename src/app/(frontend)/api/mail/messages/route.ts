import type { MessageAction } from "@/lib/mail/types";
import { applyAction, providerContext, queryMessages, requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

const num = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

// GET: list / search (account, folder, view, filters, page). PATCH: bulk read / unread / star / unstar / move / archive / spam.
// DELETE: bulk delete (to Trash; permanent from Trash).
export async function GET(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const u = new URL(request.url).searchParams;
  const view = u.get("view");
  const result = await queryMessages(auth.payload, {
    view: view === "all-inbox" || view === "starred" || view === "folder" ? view : undefined,
    accountId: num(u.get("accountId")), folderId: num(u.get("folderId")), threadId: u.get("threadId") ?? undefined,
    q: u.get("q") ?? undefined, from: u.get("from") ?? undefined, to: u.get("to") ?? undefined, subject: u.get("subject") ?? undefined,
    hasAttachment: u.get("hasAttachment") === "1", unread: u.get("unread") === "1", dateFrom: u.get("dateFrom") ?? undefined, dateTo: u.get("dateTo") ?? undefined,
    page: num(u.get("page")), limit: num(u.get("limit")),
  });
  return Response.json(result);
}

export async function PATCH(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => null)) as { ids?: number[]; action?: MessageAction } | null;
  if (!body?.ids?.length || !body.action) return Response.json({ error: "Pick messages and an action." }, { status: 400 });
  try {
    const { provider } = await providerContext(auth.payload);
    const n = await applyAction(auth.payload, provider, body.ids, body.action);
    return Response.json({ ok: true, updated: n });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update the messages." }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => null)) as { ids?: number[] } | null;
  if (!body?.ids?.length) return Response.json({ error: "Pick messages to delete." }, { status: 400 });
  try {
    const { provider } = await providerContext(auth.payload);
    const n = await applyAction(auth.payload, provider, body.ids, { type: "delete" });
    return Response.json({ ok: true, deleted: n });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not delete." }, { status: 502 });
  }
}

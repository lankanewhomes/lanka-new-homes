import { runSendOrDraft } from "@/lib/mail/compose";
import { requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

// POST: forward to an existing message (inReplyToId). Same body as /api/mail/send; replyMode is fixed by the path
// (reply all is /api/mail/send with replyMode "replyAll").
export async function POST(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => null);
  if (!body?.inReplyToId) return Response.json({ error: "inReplyToId is required." }, { status: 400 });
  const forwarded = new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({ ...body, replyMode: "forward" }) });
  return runSendOrDraft(auth.payload, forwarded, "send");
}

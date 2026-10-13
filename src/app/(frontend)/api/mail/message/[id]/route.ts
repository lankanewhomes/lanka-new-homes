import { applyAction, loadMessageRows, mapRow, poolOf, providerContext, requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

// GET: one message with its full body. The body is fetched from the provider the first time it is opened, then cached.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const { payload } = auth;
  const id = Number((await params).id);
  const row = (await loadMessageRows(payload, [id]))[0];
  if (!row) return Response.json({ error: "Message not found." }, { status: 404 });

  if (!row.html_body) {
    try {
      const { provider } = await providerContext(payload);
      const full = await provider.getMessage(row.zoho_account_id, row.zoho_folder_id, row.zoho_message_id);
      if (full) {
        await poolOf(payload).query(
          `update payload.mail_messages set html_body = $2, attachments = $3::jsonb, has_attachments = $4, body_fetched_at = now(), updated_at = now() where id = $1`,
          [id, full.htmlBody || `<pre>${full.textBody ?? ""}</pre>`, JSON.stringify(full.attachments), full.attachments.length > 0],
        );
        row.html_body = full.htmlBody;
        row.attachments = full.attachments;
      }
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Could not load the message." }, { status: 502 });
    }
  }
  return Response.json({ message: { ...mapRow(row, true), accountEmail: row.account_email } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { provider } = await providerContext(auth.payload);
    await applyAction(auth.payload, provider, [Number((await params).id)], { type: "delete" });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not delete." }, { status: 502 });
  }
}

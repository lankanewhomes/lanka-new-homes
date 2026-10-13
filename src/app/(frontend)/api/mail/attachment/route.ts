import { loadMessageRows, providerContext, requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

// GET ?messageId=<db id>&attachmentId=<provider id>: streams the file through the server so tokens never reach the browser.
export async function GET(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const u = new URL(request.url).searchParams;
  const row = (await loadMessageRows(auth.payload, [Number(u.get("messageId"))]))[0];
  const attachmentId = u.get("attachmentId");
  if (!row || !attachmentId) return Response.json({ error: "Attachment not found." }, { status: 404 });
  try {
    const { provider } = await providerContext(auth.payload);
    const file = await provider.getAttachment(row.zoho_account_id, row.zoho_folder_id, row.zoho_message_id, attachmentId);
    const inline = u.get("inline") === "1";
    return new Response(file.bytes as BodyInit, {
      headers: {
        "Content-Type": file.contentType || "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not download the attachment." }, { status: 502 });
  }
}

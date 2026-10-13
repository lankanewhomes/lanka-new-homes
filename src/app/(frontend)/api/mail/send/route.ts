import { runSendOrDraft } from "@/lib/mail/compose";
import { requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

// POST: send a new message, a reply / reply all, or a forward, through the Zoho Mail API so it lands in Zoho's Sent folder.
export async function POST(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  return runSendOrDraft(auth.payload, request, "send");
}

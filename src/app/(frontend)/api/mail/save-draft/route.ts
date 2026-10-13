import { runSendOrDraft } from "@/lib/mail/compose";
import { requireMailAdmin } from "@/lib/mail/server";

export const dynamic = "force-dynamic";

// POST: save (or update) a draft in Zoho's Drafts folder.
export async function POST(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  return runSendOrDraft(auth.payload, request, "draft");
}

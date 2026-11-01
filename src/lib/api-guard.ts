import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "../../payload.config";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Sign-in checks for the write routes under /api (create / edit / delete / upload). Until 2026-11-01 several of them
// (projects, lands, neighborhoods, construction companies, developers, image upload) had no check at all, so anyone on the
// internet could change or delete listings. Every non-GET handler in those routes now calls one of these first.

const deny = (status: 401 | 403, error: string) => ({ error: NextResponse.json({ error }, { status }) });

/** Only a signed-in CMS admin gets through. Returns `{ error }` (a ready response) when not. */
export async function requireAdmin(request: Request): Promise<{ ok: true } | { error: NextResponse }> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) return deny(401, "Sign in first.");
  if ((user as { role?: string }).role !== "admin") return deny(403, "Admins only.");
  return { ok: true };
}

/** Any signed-in person: a CMS user (admin or developer) or a website account (Supabase). */
export async function requireSignedIn(request: Request): Promise<{ ok: true } | { error: NextResponse }> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });
  if (user) return { ok: true };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) return { ok: true };
  return deny(401, "Sign in first.");
}

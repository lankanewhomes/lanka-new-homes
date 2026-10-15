import { NextResponse } from "next/server";
import { runSocialSync, SYNC_KEY } from "@/lib/social/import";

// POST: an admin runs the import now ("Sync now" on /dashboard/social). GET: the result of the last run (admins and developers).
export const dynamic = "force-dynamic";

async function who(request: Request) {
  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../../../../../payload.config")).default;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: request.headers });
  return { payload, role: (user as { role?: string } | null)?.role };
}

export async function GET(request: Request) {
  const { payload, role } = await who(request);
  if (role !== "admin" && role !== "developer") return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const last = await payload.kv.get(SYNC_KEY).catch(() => null);
  return NextResponse.json({ last });
}

export async function POST(request: Request) {
  const { payload, role } = await who(request);
  if (role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });
  return NextResponse.json(await runSocialSync(payload));
}

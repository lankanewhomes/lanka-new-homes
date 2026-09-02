import { NextResponse } from "next/server";
import { trackProjectView } from "@/lib/tracking-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.projectSlug || !body?.developerSlug || !body?.sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await trackProjectView({
      projectSlug: String(body.projectSlug),
      developerSlug: String(body.developerSlug),
      sessionId: String(body.sessionId),
    });

    return NextResponse.json({ ok: true, inserted: result.inserted });
  } catch {
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}

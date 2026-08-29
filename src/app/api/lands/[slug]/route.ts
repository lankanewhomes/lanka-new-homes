import { NextResponse } from "next/server";
import { updateLand } from "@/lib/land-store";

type RouteContext = { params: Promise<{ slug: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { slug: ignoredSlug, ...changes } = body;
  void ignoredSlug;
  const land = await updateLand(slug, changes);

  if (!land) return NextResponse.json({ error: "Land not found" }, { status: 404 });
  return NextResponse.json({ ok: true, land });
}

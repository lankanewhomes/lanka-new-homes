import { NextResponse } from "next/server";
import { deleteHeroAd, isHeroAdStatus, updateHeroAd } from "@/lib/hero-ad-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  if (body.status !== undefined && !isHeroAdStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const changes: Record<string, unknown> = {};
  for (const field of ["image", "headline", "linkUrl", "startDate", "endDate", "order", "status", "reviewNote"] as const) {
    if (body[field] !== undefined) changes[field] = body[field];
  }
  if (body.priceLkr !== undefined) {
    changes.priceLkr = body.priceLkr === null ? null : Number(body.priceLkr);
  }

  let ad;
  try {
    ad = await updateHeroAd(id, changes);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update hero ad" }, { status: 400 });
  }
  if (!ad) return NextResponse.json({ error: "Hero ad not found" }, { status: 404 });

  return NextResponse.json({ ok: true, ad });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  await deleteHeroAd(id);
  return NextResponse.json({ ok: true });
}

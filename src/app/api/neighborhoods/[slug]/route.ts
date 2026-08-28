import { NextResponse } from "next/server";
import { deleteNeighborhood, getNeighborhoodBySlug, updateNeighborhood } from "@/lib/neighborhood-store";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);
  if (!neighborhood) return NextResponse.json({ error: "Neighborhood not found" }, { status: 404 });
  return NextResponse.json({ neighborhood });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const changes: Record<string, unknown> = {};
  for (const field of ["name", "city", "province", "description", "heroImage"] as const) {
    if (body[field] !== undefined) changes[field] = String(body[field]);
  }

  const neighborhood = await updateNeighborhood(slug, changes);
  if (!neighborhood) return NextResponse.json({ error: "Neighborhood not found" }, { status: 404 });

  return NextResponse.json({ ok: true, neighborhood });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  await deleteNeighborhood(slug);
  return NextResponse.json({ ok: true });
}

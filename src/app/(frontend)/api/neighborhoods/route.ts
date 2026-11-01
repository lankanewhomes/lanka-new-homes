import { NextResponse } from "next/server";
import { createNeighborhood, getAllNeighborhoods } from "@/lib/neighborhood-store";
import { requireAdmin } from "@/lib/api-guard";

export async function GET() {
  const neighborhoods = await getAllNeighborhoods();
  return NextResponse.json({ neighborhoods });
}

export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if ("error" in guard) return guard.error;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const requiredFields = ["name", "city", "province", "description", "heroImage"] as const;
  for (const field of requiredFields) {
    if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 });
  }

  const neighborhood = await createNeighborhood({
    name: String(body.name),
    city: String(body.city),
    province: String(body.province),
    description: String(body.description),
    heroImage: String(body.heroImage),
  });

  return NextResponse.json({ ok: true, neighborhood, slug: neighborhood.slug }, { status: 201 });
}

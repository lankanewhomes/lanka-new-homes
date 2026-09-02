import { NextResponse } from "next/server";
import { getConstructionCompanyBySlug, updateConstructionCompany } from "@/lib/construction-company-store";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const company = await getConstructionCompanyBySlug(slug);
  if (!company) return NextResponse.json({ error: "Construction company not found" }, { status: 404 });
  return NextResponse.json({ company });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const changes: Record<string, unknown> = {};
  for (const field of ["name", "logo", "description", "location", "website", "email", "phone"] as const) {
    if (body[field] === undefined) continue;
    changes[field] = String(body[field]);
  }
  if (body.yearsInBusiness !== undefined) changes.yearsInBusiness = Number(body.yearsInBusiness);
  if (Array.isArray(body.categories)) changes.categories = body.categories;
  if (body.socialLinks && typeof body.socialLinks === "object") changes.socialLinks = body.socialLinks;

  const company = await updateConstructionCompany(slug, changes);
  if (!company) return NextResponse.json({ error: "Construction company not found" }, { status: 404 });

  return NextResponse.json({ ok: true, company });
}

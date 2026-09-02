import { NextResponse } from "next/server";
import { getDeveloperBySlug, updateDeveloper } from "@/lib/developer-store";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) return NextResponse.json({ error: "Developer not found" }, { status: 404 });
  return NextResponse.json({ developer });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const changes: Record<string, unknown> = {};
  for (const field of ["name", "logo", "description", "location", "establishedYear", "yearsInBusiness", "activeProjects", "completedProjects", "website", "email", "phone"] as const) {
    if (body[field] === undefined) continue;
    changes[field] = ["establishedYear", "yearsInBusiness", "activeProjects", "completedProjects"].includes(field) ? Number(body[field]) : String(body[field]);
  }
  if (Array.isArray(body.coDevelopers)) changes.coDevelopers = body.coDevelopers;
  if (Array.isArray(body.officeHours)) changes.officeHours = body.officeHours;
  if (body.socialLinks && typeof body.socialLinks === "object") changes.socialLinks = body.socialLinks;

  const developer = await updateDeveloper(slug, changes);
  if (!developer) return NextResponse.json({ error: "Developer not found" }, { status: 404 });

  return NextResponse.json({ ok: true, developer });
}

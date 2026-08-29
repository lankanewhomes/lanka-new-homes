import { NextResponse } from "next/server";
import { createConstructionCompany, getAllConstructionCompanies } from "@/lib/construction-company-store";

export async function GET() {
  const companies = await getAllConstructionCompanies();
  return NextResponse.json({ companies });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const requiredFields = ["name", "logo", "description", "location"] as const;
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  if (!Array.isArray(body.categories) || body.categories.length === 0) {
    return NextResponse.json({ error: "At least one category is required" }, { status: 400 });
  }

  const company = await createConstructionCompany({
    name: String(body.name),
    logo: String(body.logo),
    description: String(body.description),
    location: String(body.location),
    categories: body.categories,
    yearsInBusiness: body.yearsInBusiness !== undefined ? Number(body.yearsInBusiness) : undefined,
    website: body.website ? String(body.website) : undefined,
    email: body.email ? String(body.email) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    socialLinks: body.socialLinks && typeof body.socialLinks === "object" ? body.socialLinks : undefined,
  });

  return NextResponse.json({ ok: true, company, slug: company.slug }, { status: 201 });
}

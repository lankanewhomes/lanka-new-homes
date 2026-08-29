import { NextResponse } from "next/server";
import type { CompanyProfile } from "@/types";

type Store = {
  getAll: () => Promise<CompanyProfile[]>;
  getBySlug: (slug: string) => Promise<CompanyProfile | undefined>;
  create: (input: {
    name: string;
    logo: string;
    description: string;
    location: string;
    yearsInBusiness?: number;
    website?: string;
    email?: string;
    phone?: string;
    officeHours?: CompanyProfile["officeHours"];
    socialLinks?: CompanyProfile["socialLinks"];
  }) => Promise<CompanyProfile>;
  update: (slug: string, changes: Partial<Omit<CompanyProfile, "slug">>) => Promise<CompanyProfile | undefined>;
};

// Shared list+create / get+patch handlers for the CompanyProfile-shaped
// partner directories (marketing companies, sales companies, architects,
// interior designers) — each route.ts just supplies its store.
export function companyProfileListHandlers(store: Store) {
  async function GET() {
    const companies = await store.getAll();
    return NextResponse.json({ companies });
  }

  async function POST(request: Request) {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const requiredFields = ["name", "logo", "description", "location"] as const;
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const company = await store.create({
      name: String(body.name),
      logo: String(body.logo),
      description: String(body.description),
      location: String(body.location),
      yearsInBusiness: body.yearsInBusiness !== undefined ? Number(body.yearsInBusiness) : undefined,
      website: body.website ? String(body.website) : undefined,
      email: body.email ? String(body.email) : undefined,
      phone: body.phone ? String(body.phone) : undefined,
      officeHours: Array.isArray(body.officeHours) ? body.officeHours : undefined,
      socialLinks: body.socialLinks && typeof body.socialLinks === "object" ? body.socialLinks : undefined,
    });

    return NextResponse.json({ ok: true, company, slug: company.slug }, { status: 201 });
  }

  return { GET, POST };
}

export function companyProfileItemHandlers(store: Store, entityLabel: string) {
  async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const company = await store.getBySlug(slug);
    if (!company) return NextResponse.json({ error: `${entityLabel} not found` }, { status: 404 });
    return NextResponse.json({ company });
  }

  async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const changes: Record<string, unknown> = {};
    for (const field of ["name", "logo", "description", "location", "website", "email", "phone"] as const) {
      if (body[field] === undefined) continue;
      changes[field] = String(body[field]);
    }
    if (body.yearsInBusiness !== undefined) changes.yearsInBusiness = Number(body.yearsInBusiness);
    if (Array.isArray(body.officeHours)) changes.officeHours = body.officeHours;
    if (body.socialLinks && typeof body.socialLinks === "object") changes.socialLinks = body.socialLinks;

    const company = await store.update(slug, changes);
    if (!company) return NextResponse.json({ error: `${entityLabel} not found` }, { status: 404 });

    return NextResponse.json({ ok: true, company });
  }

  return { GET, PATCH };
}

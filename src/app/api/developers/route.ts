import { NextResponse } from "next/server";
import { createDeveloper, getAllDevelopers } from "@/lib/developer-store";

export async function GET() {
  const developers = await getAllDevelopers();
  return NextResponse.json({ developers });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const requiredFields = [
    "name",
    "logo",
    "description",
    "location",
    "establishedYear",
    "yearsInBusiness",
    "activeProjects",
    "completedProjects",
    "website",
    "email",
    "phone",
  ] as const;

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const developer = await createDeveloper({
    name: String(body.name),
    logo: String(body.logo),
    description: String(body.description),
    location: String(body.location),
    establishedYear: Number(body.establishedYear),
    yearsInBusiness: Number(body.yearsInBusiness),
    activeProjects: Number(body.activeProjects),
    completedProjects: Number(body.completedProjects),
    website: String(body.website),
    email: String(body.email),
    phone: String(body.phone),
  });

  return NextResponse.json({ ok: true, developer, slug: developer.slug }, { status: 201 });
}

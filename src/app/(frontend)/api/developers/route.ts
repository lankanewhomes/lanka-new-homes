import { NextResponse } from "next/server";
import { createDeveloper, getAllDevelopers } from "@/lib/developer-store";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

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
    coDevelopers: Array.isArray(body.coDevelopers) ? body.coDevelopers : undefined,
    officeHours: Array.isArray(body.officeHours) ? body.officeHours : undefined,
    socialLinks: body.socialLinks && typeof body.socialLinks === "object" ? body.socialLinks : undefined,
  });

  // If a signed-in user submitted this (the /developers/register self-serve
  // flow) and doesn't already manage a developer, link their account to the
  // new developer profile so the dashboard scopes to them.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existingProfile } = await supabase.from("profiles").select("developer_slug").eq("id", user.id).single();
    if (!existingProfile?.developer_slug) {
      await supabaseAdmin.from("developers").update({ auth_user_id: user.id }).eq("slug", developer.slug);
      await supabaseAdmin.from("profiles").update({ role: "developer", developer_slug: developer.slug }).eq("id", user.id);
    }
  }

  return NextResponse.json({ ok: true, developer, slug: developer.slug }, { status: 201 });
}

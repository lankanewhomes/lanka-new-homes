import { NextResponse } from "next/server";
import { insertLead } from "@/lib/tracking-db";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = [
      "name",
      "phone",
      "preferredContactMethod",
      "message",
      "projectSlug",
      "developerSlug",
    ] as const;

    for (const field of required) {
      if (!body?.[field] || typeof body[field] !== "string") {
        return NextResponse.json({ error: `Missing ${field}` }, { status: 400 });
      }
    }

    if (body.email !== undefined && typeof body.email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const saved = await insertLead({
      name: body.name,
      email: typeof body.email === "string" ? body.email : "",
      phone: body.phone,
      preferredContactMethod: body.preferredContactMethod,
      message: body.message,
      projectSlug: body.projectSlug,
      developerSlug: body.developerSlug,
      marketingOptIn: typeof body.marketingOptIn === "boolean" ? body.marketingOptIn : undefined,
      userId: user?.id,
    });

    return NextResponse.json({ ok: true, id: saved.id, createdAt: saved.createdAt });
  } catch {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}

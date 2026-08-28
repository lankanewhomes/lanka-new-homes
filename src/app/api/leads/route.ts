import { NextResponse } from "next/server";
import { insertLead } from "@/lib/tracking-db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = [
      "name",
      "email",
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

    const saved = await insertLead({
      name: body.name,
      email: body.email,
      phone: body.phone,
      preferredContactMethod: body.preferredContactMethod,
      message: body.message,
      projectSlug: body.projectSlug,
      developerSlug: body.developerSlug,
    });

    return NextResponse.json({ ok: true, id: saved.id, createdAt: saved.createdAt });
  } catch {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}

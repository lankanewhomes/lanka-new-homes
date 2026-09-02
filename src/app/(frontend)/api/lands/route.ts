import { NextResponse } from "next/server";
import { createLand, getAllLands } from "@/lib/land-store";

export async function GET() {
  const lands = await getAllLands();
  return NextResponse.json({ lands });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const land = await createLand(body);
  return NextResponse.json({ ok: true, land, slug: land?.slug }, { status: 201 });
}

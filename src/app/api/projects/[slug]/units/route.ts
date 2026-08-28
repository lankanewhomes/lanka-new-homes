import { NextResponse } from "next/server";
import { getUnitsByProjectSlug, replaceUnitsForProject } from "@/lib/unit-store";
import { getProjectBySlug } from "@/lib/project-store";
import type { Unit } from "@/types";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const units = await getUnitsByProjectSlug(slug);
  return NextResponse.json({ units });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.units)) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const units = body.units.map((unit: Partial<Unit>, index: number) => ({
    id: unit.id || `${slug}-unit-${index}`,
    projectSlug: slug,
    unitNumber: unit.unitNumber || "",
    floor: Number(unit.floor ?? 0),
    apartmentType: unit.apartmentType || "",
    bedrooms: Number(unit.bedrooms ?? 0),
    areaSqFt: Number(unit.areaSqFt ?? 0),
    priceLkr: Number(unit.priceLkr ?? 0),
    priceUsd: unit.priceUsd ? Number(unit.priceUsd) : undefined,
    status: (unit.status || "Available") as Unit["status"],
    sourceUrl: unit.sourceUrl || undefined,
  }));

  const saved = await replaceUnitsForProject(slug, units);
  return NextResponse.json({ ok: true, units: saved });
}

import { NextResponse } from "next/server";
import { updateProject } from "@/lib/project-store";

type RouteContext = { params: Promise<{ slug: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { slug: ignoredSlug, ...changes } = body;
  void ignoredSlug;
  const project = await updateProject(slug, changes);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ ok: true, project });
}

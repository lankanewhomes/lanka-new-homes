import { NextResponse } from "next/server";
import { createProject, getAllProjects } from "@/lib/project-store";
import { requireAdmin } from "@/lib/api-guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const developerSlug = searchParams.get("developerSlug");

  const projects = await getAllProjects();
  const filtered = developerSlug ? projects.filter((project) => project.developerSlug === developerSlug) : projects;

  return NextResponse.json({ projects: filtered });
}

export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if ("error" in guard) return guard.error;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const requiredFields = ["name", "developerSlug", "developerName"] as const;
  for (const field of requiredFields) {
    if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 });
  }

  const project = await createProject(body);
  return NextResponse.json({ ok: true, project, slug: project?.slug }, { status: 201 });
}

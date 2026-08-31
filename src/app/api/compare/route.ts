import { NextResponse } from "next/server";
import { getProjectBySlug } from "@/lib/project-store";
import { getLandBySlug } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import type { Project } from "@/types";

type CompareItem = Project & { basePath: "/projects" | "/land" };

function splitSlugs(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((slug) => slug.trim()).filter(Boolean);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectSlugs = splitSlugs(searchParams.get("projectSlugs"));
  const landSlugs = splitSlugs(searchParams.get("landSlugs"));

  if (projectSlugs.length === 0 && landSlugs.length === 0) {
    return NextResponse.json({ error: "projectSlugs or landSlugs is required" }, { status: 400 });
  }

  const [projects, lands] = await Promise.all([
    Promise.all(projectSlugs.map((slug) => getProjectBySlug(slug))),
    Promise.all(landSlugs.map((slug) => getLandBySlug(slug))),
  ]);

  const items: CompareItem[] = [
    ...projects.filter((project): project is Project => Boolean(project)).map((project) => ({ ...project, basePath: "/projects" as const })),
    ...lands.filter((land): land is NonNullable<typeof land> => Boolean(land)).map((land) => ({ ...landToProjectShape(land), basePath: "/land" as const })),
  ];

  return NextResponse.json({ items });
}

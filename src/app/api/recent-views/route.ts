import { NextResponse } from "next/server";
import { getRecentSessionViews } from "@/lib/tracking-db";
import { getProjectBySlug } from "@/lib/project-store";
import type { Project } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  const limit = Number(searchParams.get("limit")) || 8;
  const slugs = await getRecentSessionViews(sessionId, limit);

  const resolved = await Promise.all(slugs.map((slug) => getProjectBySlug(slug)));
  const projects = resolved.filter((project): project is Project => Boolean(project));

  return NextResponse.json({ projects });
}

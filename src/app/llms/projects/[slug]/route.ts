import { getProjectBySlug } from "@/lib/project-store";
import { projectMarkdown } from "@/lib/listing-markdown";
import { getSiteUrl } from "@/lib/seo";

// /llms/projects/<slug>.md — the project page as clean markdown for AI assistants (see src/lib/listing-markdown.ts).
export const revalidate = 3600;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug.replace(/\.md$/i, "")).catch(() => undefined);
  if (!project) return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(projectMarkdown(project, getSiteUrl()), {
    headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}

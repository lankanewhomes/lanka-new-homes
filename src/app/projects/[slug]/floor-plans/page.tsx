import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { getProjectBySlug } from "@/lib/project-store";
import { PlansAndHomesSection, ProjectHero, ProjectStatsChips } from "@/components/marketplace/components";

type FloorPlansPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: FloorPlansPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Floor Plans Not Found", robots: { index: false, follow: false } };

  return {
    title: `${project.name} Floor Plans`,
    description: `Explore all floor plans and homes available at ${project.name}.`,
    alternates: { canonical: `/projects/${project.slug}/floor-plans` },
  };
}

export default async function FloorPlansPage({ params }: FloorPlansPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return notFound();

  return (
    <div className="space-y-8">
      <ProjectHero project={project} />
      <ProjectStatsChips project={project} />
      <PlansAndHomesSection project={project} />
    </div>
  );
}

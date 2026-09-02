import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar, ProjectWizard } from "@/components/dashboard/components";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { getProjectBySlug } from "@/lib/project-store";

export const metadata: Metadata = {
  title: "Edit Project",
  robots: {
    index: false,
    follow: false,
  },
};

type EditProjectPageProps = { params: Promise<{ slug: string; projectSlug: string }> };

export default async function AdminEditProjectPage({ params }: EditProjectPageProps) {
  const { slug, projectSlug } = await params;
  const developer = await getDeveloperBySlug(slug);
  const project = await getProjectBySlug(projectSlug);
  if (!developer || !project || project.developerSlug !== slug) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${project.name}`} subtitle="Update this project's details, including neighborhood and nearby places." />
        <ProjectWizard initialProject={project} developerSlug={developer.slug} developerName={developer.name} />
      </section>
    </div>
  );
}

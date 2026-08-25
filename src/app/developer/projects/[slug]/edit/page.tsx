import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar, ProjectWizard } from "@/components/dashboard/components";
import { getProjectBySlug } from "@/lib/project-store";

type EditProjectPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: EditProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return { title: project ? `Edit project: ${project.name}` : "Project Not Found", robots: { index: false, follow: false } };
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return notFound();

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <DashboardSidebar links={[{ label: "Overview", href: "/developer/dashboard" }, { label: "Projects", href: "/developer/projects" }, { label: "New Project", href: "/developer/projects/new" }, { label: "Profile", href: "/developers/prime" }]} />
      <section className="min-w-0 space-y-4">
        <DashboardHeader title={`Edit project: ${project.name}`} subtitle="Update the project information used by your listing." />
        <ProjectWizard initialProject={project} />
      </section>
    </div>
  );
}

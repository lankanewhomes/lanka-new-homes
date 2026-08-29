import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar, ProjectWizard } from "@/components/dashboard/components";
import { getDeveloperBySlug } from "@/lib/developer-store";

export const metadata: Metadata = {
  title: "New Project",
  robots: {
    index: false,
    follow: false,
  },
};

type NewProjectPageProps = { params: Promise<{ slug: string }> };

export default async function AdminNewProjectPage({ params }: NewProjectPageProps) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`New project for ${developer.name}`} subtitle="Fill in the wizard and publish when ready." />
        <ProjectWizard developerSlug={developer.slug} developerName={developer.name} />
      </section>
    </div>
  );
}

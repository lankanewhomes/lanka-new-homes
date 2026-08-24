import type { Metadata } from "next";
import { DashboardHeader, DashboardSidebar, ProjectWizard } from "@/components/dashboard/components";

export const metadata: Metadata = {
  title: "Create New Project",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewDeveloperProjectPage() {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <DashboardSidebar links={[{ label: "Overview", href: "/developer/dashboard" }, { label: "Projects", href: "/developer/projects" }, { label: "New Project", href: "/developer/projects/new" }, { label: "Create Builder Page", href: "/developer/builders/new" }]} />
      <section className="space-y-4">
        <DashboardHeader title="Create New Project" subtitle="Multi-step project wizard for publishing a new apartment development." />
        <ProjectWizard />
      </section>
    </div>
  );
}

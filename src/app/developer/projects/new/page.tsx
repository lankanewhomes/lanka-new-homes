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
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <DashboardSidebar links={[{ label: "Overview", href: "/developer/dashboard" }, { label: "Projects", href: "/developer/projects" }, { label: "New Project", href: "/developer/projects/new" }]} />
      <section className="space-y-4">
        <DashboardHeader title="Create New Project" subtitle="Multi-step project wizard for publishing a new apartment development." />
        <ProjectWizard />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { BuilderProfileForm, DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";

export const metadata: Metadata = {
  title: "Create Builder Profile",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewBuilderProfilePage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <DashboardSidebar
        links={[
          { label: "Overview", href: "/developer/dashboard" },
          { label: "Projects", href: "/developer/projects" },
          { label: "New Project", href: "/developer/projects/new" },
          { label: "Create Builder Page", href: "/developer/builders/new" },
        ]}
      />
      <section className="space-y-4">
        <DashboardHeader title="Create Builder Profile" subtitle="Submit company details once and we auto-create a public builder page." />
        <BuilderProfileForm />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { DataTable, DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";

export const metadata: Metadata = {
  title: "Project Management",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeveloperProjectsPage() {
  const rows = [
    ["Colombo Heights Residences", "Colombo 03", "Now Selling", "12,450", "158", "2026-08-20", "View | Edit | Preview | Publish | Unpublish"],
    ["Kandy Hills Residences", "Kandy", "Coming Soon", "8,120", "93", "2026-08-18", "View | Edit | Preview | Publish | Unpublish"],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <DashboardSidebar links={[{ label: "Overview", href: "/developer/dashboard" }, { label: "Projects", href: "/developer/projects" }, { label: "New Project", href: "/developer/projects/new" }, { label: "Create Builder Page", href: "/developer/builders/new" }, { label: "Leads", href: "/developer/dashboard" }, { label: "Analytics", href: "/developer/dashboard" }, { label: "Profile", href: "/developer/dashboard" }, { label: "Settings", href: "/developer/dashboard" }]} />
      <section className="space-y-4">
        <DashboardHeader title="Project Management" subtitle="Create and manage your development listings." />
        <DataTable columns={["Project", "Location", "Status", "Views", "Leads", "Updated", "Actions"]} rows={rows} />
      </section>
    </div>
  );
}

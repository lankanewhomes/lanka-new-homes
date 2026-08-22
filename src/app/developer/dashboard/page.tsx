import type { Metadata } from "next";
import { DataTable, DashboardHeader, DashboardSidebar, StatCard } from "@/components/dashboard/components";
import { projects } from "@/data/projects";
import { getDeveloperDashboardStats, getProjectPerformance } from "@/lib/tracking-db";

export const metadata: Metadata = {
  title: "Developer Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeveloperDashboardPage() {
  const developerSlug = "ceylon-urban-developments";
  const stats = getDeveloperDashboardStats(developerSlug);
  const perf = getProjectPerformance(developerSlug);

  const rows = projects
    .filter((project) => project.developerSlug === developerSlug)
    .map((project) => [
      project.name,
      String(perf.viewsMap.get(project.slug) ?? 0),
      String(perf.leadsMap.get(project.slug) ?? 0),
      project.status,
    ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:pt-8">
      <DashboardSidebar links={[{ label: "Overview", href: "/developer/dashboard" }, { label: "Projects", href: "/developer/projects" }, { label: "Leads", href: "/developer/dashboard" }, { label: "Analytics", href: "/developer/dashboard" }, { label: "Profile", href: "/developer/dashboard" }, { label: "Settings", href: "/developer/dashboard" }]} />
      <section className="space-y-4">
        <DashboardHeader title="Developer Dashboard" subtitle="Manage projects, leads, and publication status." />
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Projects" value={String(rows.length)} />
          <StatCard label="Published" value="1" />
          <StatCard label="Drafts" value="1" />
          <StatCard label="Views" value={String(stats.totalViews)} />
          <StatCard label="Leads" value={String(stats.totalLeads)} />
          <StatCard label="New Today" value={String(stats.newLeadsToday)} />
        </div>
        <DataTable columns={["Project", "Views", "Leads", "Status"]} rows={rows} />
      </section>
    </div>
  );
}

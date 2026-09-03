import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DataTable, DashboardHeader, DashboardSidebar, StatCard } from "@/components/dashboard/components";
import { getAllProjects } from "@/lib/project-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { getDeveloperDashboardStats, getProjectPerformance } from "@/lib/tracking-db";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Developer Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DeveloperDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "developer" || !profile.developerSlug) {
    redirect("/developers/login");
  }

  const developerSlug = profile.developerSlug;
  const developer = await getDeveloperBySlug(developerSlug);
  const allProjects = await getAllProjects();
  const stats = await getDeveloperDashboardStats(developerSlug);
  const perf = await getProjectPerformance(developerSlug);

  const projects = allProjects.filter((project) => project.developerSlug === developerSlug);
  const rows = projects.map((project) => [
    project.name,
    String(perf.viewsMap.get(project.slug) ?? 0),
    String(perf.leadsMap.get(project.slug) ?? 0),
    project.status,
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:pt-8">
      <DashboardSidebar links={[{ label: "Overview", href: "/developers/dashboard" }, { label: `${developer?.name ?? "Company"} projects`, href: `/admin/developers/${developerSlug}/projects` }, { label: "Homepage Hero", href: "/developers/dashboard/homepage-hero" }, { label: "Profile", href: `/developers/${developerSlug}` }]} />
      <section className="space-y-4">
        <DashboardHeader title="Developer Dashboard" subtitle={`Signed in as ${developer?.name ?? developerSlug} (preview).`} />
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Projects" value={String(rows.length)} />
          <StatCard label="Views" value={String(stats.totalViews)} />
          <StatCard label="Leads" value={String(stats.totalLeads)} />
          <StatCard label="New Today" value={String(stats.newLeadsToday)} />
        </div>
        {rows.length === 0 ? (
          <p className="border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">No projects yet.</p>
        ) : (
          <DataTable columns={["Project", "Views", "Leads", "Status"]} rows={rows} />
        )}
      </section>
    </div>
  );
}

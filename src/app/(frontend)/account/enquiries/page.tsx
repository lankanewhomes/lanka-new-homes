import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DashboardHeader, DashboardSidebar, ACCOUNT_NAV_LINKS } from "@/components/dashboard/components";
import { getAllProjects } from "@/lib/project-store";
import { getAllDevelopers } from "@/lib/developer-store";

export const metadata: Metadata = {
  title: "My Enquiries",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<string, string> = {
  New: "bg-amber-100 text-amber-800",
  Contacted: "bg-blue-100 text-blue-800",
  Qualified: "bg-emerald-100 text-emerald-800",
  Closed: "bg-stone-200 text-stone-600",
};

export default async function EnquiriesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const [{ data: leads }, projects, developers] = await Promise.all([
    supabase
      .from("leads")
      .select("id, message, status, project_slug, developer_slug, created_at")
      .order("created_at", { ascending: false }),
    getAllProjects(),
    getAllDevelopers(),
  ]);

  const projectBySlug = new Map(projects.map((project) => [project.slug, project]));
  const developerBySlug = new Map(developers.map((developer) => [developer.slug, developer]));

  const enquiries = leads ?? [];

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={ACCOUNT_NAV_LINKS} />
      <section className="space-y-4">
        <DashboardHeader title="My enquiries" subtitle="Builders you've contacted, and where things stand." />

        {enquiries.length === 0 ? (
          <p className="text-sm text-stone-600">
            You haven&apos;t contacted any builders yet. <Link href="/projects">Browse new homes</Link> and use &quot;Request info&quot; on a listing to reach out.
          </p>
        ) : (
          <div className="space-y-3">
            {enquiries.map((lead) => {
              const project = projectBySlug.get(lead.project_slug);
              const developer = developerBySlug.get(lead.developer_slug);
              return (
                <article key={lead.id} className="border border-stone-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-stone-900">
                        {project ? <Link href={`/projects/${project.slug}`} className="hover:underline">{project.name}</Link> : lead.project_slug}
                      </p>
                      <p className="text-sm text-stone-600">
                        {developer ? <Link href={`/developers/${developer.slug}`} className="hover:underline">{developer.name}</Link> : lead.developer_slug}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[lead.status] ?? "bg-stone-100 text-stone-600"}`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone-500">Enquiry sent: {new Date(lead.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <p className="mt-2 text-sm text-stone-700">{lead.message}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

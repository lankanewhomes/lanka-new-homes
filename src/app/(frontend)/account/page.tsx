import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DashboardHeader, DashboardSidebar, StatCard, ACCOUNT_NAV_LINKS } from "@/components/dashboard/components";
import { RecentlyViewedPreview } from "@/components/account/recently-viewed-preview";
import { formatLkr } from "@/lib/format";
import type { Developer, Project } from "@/types";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (profile.role === "developer" && profile.developerSlug) {
    redirect(`/developers/${profile.developerSlug}`);
  }

  const supabase = await createSupabaseServerClient();

  const [savedListingsRes, savedDevelopersRes, savedSearchesRes, leadsRes] = await Promise.all([
    supabase.from("saved_listings").select("project_slug, projects(data)").eq("user_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("saved_developers").select("developer_slug, developers(data)").eq("user_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("saved_searches").select("id, is_active").eq("user_id", profile.id),
    supabase.from("leads").select("id, name, message, created_at, status, project_slug, developer_slug").order("created_at", { ascending: false }).limit(5),
  ]);

  const savedProjects = (savedListingsRes.data ?? [])
    .map((row) => (row as unknown as { projects: { data: Project } | null }).projects?.data)
    .filter((project): project is Project => Boolean(project));

  const savedDevelopers = (savedDevelopersRes.data ?? [])
    .map((row) => (row as unknown as { developers: { data: Developer } | null }).developers?.data)
    .filter((developer): developer is Developer => Boolean(developer));

  const savedSearches = savedSearchesRes.data ?? [];
  const activeAlerts = savedSearches.filter((search) => search.is_active).length;
  const recentEnquiries = leadsRes.data ?? [];

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={ACCOUNT_NAV_LINKS} />
      <section className="space-y-6">
        <DashboardHeader title={`Welcome back${profile.fullName ? `, ${profile.fullName}` : ""}`} subtitle={`Signed in as ${profile.email}.`} />

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Saved Properties" value={String(savedProjects.length)} />
          <StatCard label="Saved Developments" value={String(savedDevelopers.length)} />
          <StatCard label="Saved Searches" value={String(savedSearches.length)} />
          <StatCard label="Active Alerts" value={String(activeAlerts)} />
          <StatCard label="Enquiries Sent" value={String(recentEnquiries.length)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-900">Recently viewed</h2>
            </div>
            <RecentlyViewedPreview />
          </div>

          <div className="space-y-3 border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-900">Saved homes</h2>
              <Link href="/account/saved" className="text-xs font-medium text-stone-600 hover:text-stone-900">View all →</Link>
            </div>
            {savedProjects.length === 0 ? (
              <p className="text-xs text-stone-500">You haven&apos;t saved any listings yet.</p>
            ) : (
              <div className="space-y-2">
                {savedProjects.slice(0, 3).map((project) => (
                  <Link key={project.slug} href={`/projects/${project.slug}`} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-stone-200 bg-stone-100">
                      <Image src={project.heroImage} alt={project.name} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">{project.name}</p>
                      <p className="text-xs text-stone-500">{project.startingPriceLkr > 0 ? formatLkr(project.startingPriceLkr) : project.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-900">Saved developments</h2>
              <Link href="/account/developments" className="text-xs font-medium text-stone-600 hover:text-stone-900">View all →</Link>
            </div>
            {savedDevelopers.length === 0 ? (
              <p className="text-xs text-stone-500">You&apos;re not following any developers yet.</p>
            ) : (
              <div className="space-y-2">
                {savedDevelopers.slice(0, 3).map((developer) => (
                  <Link key={developer.slug} href={`/developers/${developer.slug}`} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-stone-200 bg-stone-100">
                      <Image src={developer.logo} alt={developer.name} fill className="object-contain p-1" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">{developer.name}</p>
                      <p className="text-xs text-stone-500">{developer.activeProjects} active project{developer.activeProjects === 1 ? "" : "s"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-900">Recent enquiries</h2>
              <Link href="/account/enquiries" className="text-xs font-medium text-stone-600 hover:text-stone-900">View all →</Link>
            </div>
            {recentEnquiries.length === 0 ? (
              <p className="text-xs text-stone-500">You haven&apos;t contacted any builders yet.</p>
            ) : (
              <div className="space-y-2">
                {recentEnquiries.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">{lead.project_slug}</p>
                      <p className="text-xs text-stone-500">{new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="shrink-0 border border-stone-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-600">{lead.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { getSavedProfiles } from "@/lib/saved-profiles";
import type { Project } from "@/types";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "My Account",
  robots: { index: false, follow: false },
}, { path: "/account" });

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (profile.role === "developer" && profile.developerSlug) {
    redirect(`/developers/${profile.developerSlug}`);
  }

  const supabase = await createSupabaseServerClient();

  const [savedListingsRes, savedProfiles, savedSearchesRes, leadsRes] = await Promise.all([
    supabase.from("saved_listings").select("project_slug, projects(data)").eq("user_id", profile.id).order("created_at", { ascending: false }),
    // Followed developers + followed companies (saved_developers + saved_companies).
    getSavedProfiles(supabase, profile.id),
    supabase.from("saved_searches").select("id, is_active").eq("user_id", profile.id),
    supabase.from("leads").select("id, name, message, created_at, status, project_slug, developer_slug").order("created_at", { ascending: false }).limit(5),
  ]);

  const savedProjects = (savedListingsRes.data ?? [])
    .map((row) => (row as unknown as { projects: { data: Project } | null }).projects?.data)
    .filter((project): project is Project => Boolean(project));

  const savedSearches = savedSearchesRes.data ?? [];
  const activeAlerts = savedSearches.filter((search) => search.is_active).length;
  const recentEnquiries = leadsRes.data ?? [];

  return (
    <AccountDashboard
      name={profile.fullName ?? ""}
      email={profile.email ?? ""}
      avatarUrl={profile.avatarUrl}
      savedProjects={savedProjects}
      followed={savedProfiles}
      savedSearchCount={savedSearches.length}
      activeAlerts={activeAlerts}
      enquiries={recentEnquiries}
    />
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AccountShell, AccountPageHero } from "@/components/account/account-shell";
import { SavedPropertiesList } from "@/components/account/saved-properties-list";
import type { Project } from "@/types";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Saved Properties",
  robots: { index: false, follow: false },
}, { path: "/account/saved" });

export default async function SavedListingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const { data: saved } = await supabase
    .from("saved_listings")
    .select("project_slug, projects(data)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const projects = (saved ?? [])
    .map((row) => (row as unknown as { projects: { data: Project } | null }).projects?.data)
    .filter((project): project is Project => Boolean(project));

  return (
    <AccountShell active="/account/saved">
      <AccountPageHero
        title="Saved properties."
        intro="The listings you have bookmarked. Compare them side by side or remove the ones you are done with."
        stat={{ label: "Saved properties", value: projects.length }}
        cta={{ label: "Browse new homes", href: "/projects" }}
      />
      <section className="fdv-box fdv-box--gray" id="saved" aria-label="Saved properties">
        <SavedPropertiesList userId={profile.id} initialProjects={projects} />
      </section>
    </AccountShell>
  );
}

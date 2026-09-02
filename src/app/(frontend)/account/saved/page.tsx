import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ProjectListItem } from "@/components/marketplace/components";
import type { Project } from "@/types";

export const metadata: Metadata = {
  title: "Saved Listings",
  robots: { index: false, follow: false },
};

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
    <div className="static-page-shell">
      <h1>Saved listings</h1>
      <p className="static-page-lede">Projects you&apos;ve saved for later.</p>

      {projects.length === 0 ? (
        <p style={{ marginTop: 24 }}>
          You haven&apos;t saved any listings yet. <Link href="/projects">Browse new homes</Link> and tap the heart icon to save one.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {projects.map((project) => (
            <ProjectListItem key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

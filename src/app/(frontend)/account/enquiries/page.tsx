import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AccountShell, AccountPageHero } from "@/components/account/account-shell";
import { getAllProjects } from "@/lib/project-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "My Enquiries",
  robots: { index: false, follow: false },
}, { path: "/account/enquiries" });

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
    <AccountShell active="/account/enquiries">
      <AccountPageHero
        title="My enquiries."
        intro="The developers you have contacted, and where each enquiry stands."
        stat={{ label: "Enquiries sent", value: enquiries.length }}
        cta={{ label: "Browse new homes", href: "/projects" }}
      />
      <section className="fdv-box fdv-box--cream" id="enquiries" aria-label="My enquiries">
        {enquiries.length === 0 ? (
          <div className="fdv-box-card account-empty">
            <p>You have not contacted any developers yet. Use &quot;Request info&quot; on a listing to reach out.</p>
            <Link href="/projects" className="account-link">Browse new homes</Link>
          </div>
        ) : (
          <div className="account-stack">
            {enquiries.map((lead) => {
              const project = projectBySlug.get(lead.project_slug);
              const developer = developerBySlug.get(lead.developer_slug);
              return (
                <article key={lead.id} className="account-panel">
                  <div className="account-panel-head">
                    <div>
                      <h2>
                        {project ? <Link href={`/projects/${project.slug}`}>{project.name}</Link> : lead.project_slug}
                      </h2>
                      <p className="account-muted">
                        {developer ? <Link href={`/developers/${developer.slug}`} className="account-link">{developer.name}</Link> : lead.developer_slug}
                      </p>
                    </div>
                    <span className="account-enquiry-status">{lead.status}</span>
                  </div>
                  <p className="account-muted">Sent {new Date(lead.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <p>{lead.message}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AccountShell>
  );
}

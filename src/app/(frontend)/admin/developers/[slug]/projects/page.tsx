import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { Button } from "@/components/ui/button";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Developer Projects",
  robots: {
    index: false,
    follow: false,
  },
};

type DeveloperProjectsPageProps = { params: Promise<{ slug: string }> };

export default async function AdminDeveloperProjectsPage({ params }: DeveloperProjectsPageProps) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) return notFound();

  const allProjects = await getAllProjects();
  const developerProjects = allProjects.filter((project) => project.developerSlug === slug);

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <DashboardHeader title={`${developer.name} projects`} subtitle="Projects linked to this developer record." />
          <Link href={`/admin/developers/${slug}/projects/new`}><Button>New project</Button></Link>
        </div>

        {developerProjects.length === 0 ? (
          <p className="border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">No projects linked to this developer yet.</p>
        ) : (
          <div className="overflow-x-auto border border-stone-200 bg-white">
            <table className="w-full min-w-190 text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="p-3 text-left">Project</th>
                  <th className="p-3 text-left">Location</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">From</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {developerProjects.map((project) => (
                  <tr key={project.slug} className="border-t border-stone-100">
                    <td className="p-3 font-medium text-stone-900">{project.name}</td>
                    <td className="p-3">{project.location}</td>
                    <td className="p-3">{project.status}</td>
                    <td className="p-3">{formatLkr(project.startingPriceLkr)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/admin/developers/${slug}/projects/${project.slug}/edit`} className="text-stone-900 underline">Edit</Link>
                        <Link href={`/projects/${project.slug}`} className="text-stone-900 underline">View</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { Button } from "@/components/ui/button";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";

export const metadata: Metadata = {
  title: "Developers",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDevelopersPage() {
  const [developers, projects] = await Promise.all([getAllDevelopers(), getAllProjects()]);

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <DashboardHeader title="Developers" subtitle="Manage developer profiles shown on the public /developers directory." />
          <Link href="/admin/developers/new"><Button>Add developer</Button></Link>
        </div>

        <div className="overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-3 text-left">Developer</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Website</th>
                <th className="p-3 text-left">Projects</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {developers.map((developer) => {
                const projectCount = projects.filter((project) => project.developerSlug === developer.slug).length;
                return (
                  <tr key={developer.slug} className="border-t border-stone-100">
                    <td className="p-3 font-medium text-stone-900">{developer.name}</td>
                    <td className="p-3">{developer.location}</td>
                    <td className="p-3">{developer.website ? <a href={developer.website} target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">{developer.website.replace(/^https?:\/\//, "")}</a> : <span className="text-stone-400">Not set</span>}</td>
                    <td className="p-3">{projectCount}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/admin/developers/${developer.slug}/edit`} className="text-stone-900 underline">Edit</Link>
                        <Link href={`/admin/developers/${developer.slug}/projects`} className="text-stone-900 underline">Projects</Link>
                        <Link href={`/developers/${developer.slug}`} className="text-stone-900 underline">View</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

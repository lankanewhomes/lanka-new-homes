import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader, DashboardSidebar, StatCard } from "@/components/dashboard/components";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllProjects } from "@/lib/project-store";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const [developers, projects] = await Promise.all([getAllDevelopers(), getAllProjects()]);

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title="Admin Dashboard" subtitle="Review and edit marketplace listings." />
        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Total Projects" value={String(projects.length)} />
          <StatCard label="Developers" value={String(developers.length)} />
        </div>

        <div className="overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-3 text-left">Project</th>
                <th className="p-3 text-left">Developer</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.slug} className="border-t border-stone-100">
                  <td className="p-3 font-medium text-stone-900">{project.name}</td>
                  <td className="p-3">{project.developerName}</td>
                  <td className="p-3">{project.location}</td>
                  <td className="p-3">{formatLkr(project.startingPriceLkr)}</td>
                  <td className="p-3">{project.status}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/admin/developers/${project.developerSlug}/projects/${project.slug}/edit`} className="text-stone-900 underline">Edit</Link>
                      <Link href={`/projects/${project.slug}`} className="text-stone-900 underline">View</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-3 text-left">Developer</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Website</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {developers.map((developer) => (
                <tr key={developer.slug} className="border-t border-stone-100">
                  <td className="p-3 font-medium text-stone-900">{developer.name}</td>
                  <td className="p-3">{developer.location}</td>
                  <td className="p-3">{developer.website ? <a href={developer.website} target="_blank" rel="noopener noreferrer" className="underline">{developer.website.replace(/^https?:\/\//, "")}</a> : <span className="text-stone-400">Not set</span>}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/admin/developers/${developer.slug}/edit`} className="text-stone-900 underline">Edit</Link>
                      <Link href={`/admin/developers/${developer.slug}/projects`} className="text-stone-900 underline">Projects</Link>
                      <Link href={`/developers/${developer.slug}`} className="text-stone-900 underline">View</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

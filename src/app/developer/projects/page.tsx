import type { Metadata } from "next";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import Link from "next/link";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Project Management",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeveloperProjectsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <DashboardSidebar links={[{ label: "Overview", href: "/developer/dashboard" }, { label: "Projects", href: "/developer/projects" }, { label: "New Project", href: "/developer/projects/new" }, { label: "Create Builder Page", href: "/developer/builders/new" }, { label: "Leads", href: "/developer/dashboard" }, { label: "Analytics", href: "/developer/dashboard" }, { label: "Profile", href: "/developers/prime" }, { label: "Settings", href: "/developer/dashboard" }]} />
      <section className="space-y-4">
        <DashboardHeader title="Project Management" subtitle="Create and manage your development listings." />
        <div className="overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-stone-50"><tr>{["Project", "Location", "Status", "Views", "Leads", "Updated", "Actions"].map((column) => <th key={column} className="p-3 text-left">{column}</th>)}</tr></thead>
            <tbody>{projects.map((project) => <tr key={project.slug} className="border-t border-stone-100">
              <td className="p-3">{project.name}</td><td className="p-3">{project.location}</td><td className="p-3">{project.status}</td><td className="p-3">0</td><td className="p-3">0</td><td className="p-3">2026-08-24</td>
              <td className="p-3"><div className="flex flex-wrap gap-2"><Link href={`/projects/${project.slug}`} className="underline">View</Link><Link href={`/developer/projects/${project.slug}/edit`} className="underline">Edit</Link><Link href={`/projects/${project.slug}`} className="underline">Preview</Link></div></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

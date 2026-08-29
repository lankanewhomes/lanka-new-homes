import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { Button } from "@/components/ui/button";
import { getAllArchitects } from "@/lib/architect-store";

export const metadata: Metadata = {
  title: "Architects",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminArchitectsPage() {
  const architects = await getAllArchitects();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <DashboardHeader title="Architects" subtitle="Manage architect profiles linked from a project's Connected Pages." />
          <Link href="/admin/architects/new"><Button>Add architect</Button></Link>
        </div>

        <div className="overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-3 text-left">Architect</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Website</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {architects.map((architect) => (
                <tr key={architect.slug} className="border-t border-stone-100">
                  <td className="p-3 font-medium text-stone-900">{architect.name}</td>
                  <td className="p-3">{architect.location}</td>
                  <td className="p-3">{architect.website ? <a href={architect.website} target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">{architect.website.replace(/^https?:\/\//, "")}</a> : <span className="text-stone-400">Not set</span>}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/admin/architects/${architect.slug}/edit`} className="text-stone-900 underline">Edit</Link>
                      <Link href={`/architects/${architect.slug}`} className="text-stone-900 underline">View</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {architects.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-sm text-stone-500">No architects yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { Button } from "@/components/ui/button";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";

export const metadata: Metadata = {
  title: "Neighborhoods",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNeighborhoodsPage() {
  const neighborhoods = await getAllNeighborhoods();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <DashboardHeader title="Neighborhoods" subtitle="Manage neighborhood pages. Projects link to these automatically when their neighborhood slug matches." />
          <Link href="/admin/neighborhoods/new"><Button>Add neighborhood</Button></Link>
        </div>

        {neighborhoods.length === 0 ? (
          <p className="border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">No neighborhoods yet.</p>
        ) : (
          <div className="overflow-x-auto border border-stone-200 bg-white">
            <table className="w-full min-w-190 text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="p-3 text-left">Neighborhood</th>
                  <th className="p-3 text-left">City</th>
                  <th className="p-3 text-left">Province</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {neighborhoods.map((neighborhood) => (
                  <tr key={neighborhood.slug} className="border-t border-stone-100">
                    <td className="p-3 font-medium text-stone-900">{neighborhood.name}</td>
                    <td className="p-3">{neighborhood.city}</td>
                    <td className="p-3">{neighborhood.province}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/admin/neighborhoods/${neighborhood.slug}/edit`} className="text-stone-900 underline">Edit</Link>
                        <Link href={`/neighborhoods/${neighborhood.slug}`} className="text-stone-900 underline">View</Link>
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

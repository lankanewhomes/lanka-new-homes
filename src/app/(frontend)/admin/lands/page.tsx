import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { getAllLands } from "@/lib/land-store";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Land Listings",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLandsPage() {
  const lands = await getAllLands();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <DashboardHeader title="Land Listings" subtitle="Raw land parcels for sale, listed by developers, construction companies, and builders." />
          <Link href="/admin/lands/new" className="border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white">Add land listing</Link>
        </div>

        <div className="overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Seller</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Size</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lands.map((land) => (
                <tr key={land.slug} className="border-t border-stone-100">
                  <td className="p-3 font-medium text-stone-900">{land.title}</td>
                  <td className="p-3">{land.sellerName}</td>
                  <td className="p-3">{land.location}</td>
                  <td className="p-3">{land.landSizePerches} perches</td>
                  <td className="p-3">{formatLkr(land.priceLkr)}</td>
                  <td className="p-3">{land.status}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/admin/lands/${land.slug}/edit`} className="text-stone-900 underline">Edit</Link>
                      <Link href={`/land/${land.slug}`} className="text-stone-900 underline">View</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {lands.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-stone-500">No land listings yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

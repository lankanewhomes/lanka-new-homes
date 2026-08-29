import type { Metadata } from "next";
import Link from "next/link";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { Button } from "@/components/ui/button";
import { getAllMarketingCompanies } from "@/lib/marketing-company-store";

export const metadata: Metadata = {
  title: "Marketing Companies",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminMarketingCompaniesPage() {
  const companies = await getAllMarketingCompanies();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <DashboardHeader title="Marketing Companies" subtitle="Manage marketing company profiles linked from a project's Connected Pages." />
          <Link href="/admin/marketing-companies/new"><Button>Add marketing company</Button></Link>
        </div>

        <div className="overflow-x-auto border border-stone-200 bg-white">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Website</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.slug} className="border-t border-stone-100">
                  <td className="p-3 font-medium text-stone-900">{company.name}</td>
                  <td className="p-3">{company.location}</td>
                  <td className="p-3">{company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">{company.website.replace(/^https?:\/\//, "")}</a> : <span className="text-stone-400">Not set</span>}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/admin/marketing-companies/${company.slug}/edit`} className="text-stone-900 underline">Edit</Link>
                      <Link href={`/marketing-companies/${company.slug}`} className="text-stone-900 underline">View</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-sm text-stone-500">No marketing companies yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { CompanyProfileForm, type CompanyProfileFormKind } from "@/components/dashboard/company-profile-form";
import { getSalesCompanyBySlug } from "@/lib/sales-company-store";

export const metadata: Metadata = {
  title: "Edit Sales Company",
  robots: {
    index: false,
    follow: false,
  },
};

const kind: CompanyProfileFormKind = {
  apiBase: "/api/sales-companies",
  listHref: "/admin/sales-companies",
  namePlaceholder: "e.g. Prime Realty Sales",
  entityLabel: "Sales Company",
};

type EditSalesCompanyPageProps = { params: Promise<{ slug: string }> };

export default async function AdminEditSalesCompanyPage({ params }: EditSalesCompanyPageProps) {
  const { slug } = await params;
  const company = await getSalesCompanyBySlug(slug);
  if (!company) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${company.name}`} subtitle="Update this sales company's profile." />
        <CompanyProfileForm kind={kind} initialCompany={company} />
      </section>
    </div>
  );
}

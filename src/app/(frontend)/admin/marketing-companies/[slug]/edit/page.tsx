import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { CompanyProfileForm, type CompanyProfileFormKind } from "@/components/dashboard/company-profile-form";
import { getMarketingCompanyBySlug } from "@/lib/marketing-company-store";

export const metadata: Metadata = {
  title: "Edit Marketing Company",
  robots: {
    index: false,
    follow: false,
  },
};

const kind: CompanyProfileFormKind = {
  apiBase: "/api/marketing-companies",
  listHref: "/admin/marketing-companies",
  namePlaceholder: "e.g. ORA Creative Agency",
  entityLabel: "Marketing Company",
};

type EditMarketingCompanyPageProps = { params: Promise<{ slug: string }> };

export default async function AdminEditMarketingCompanyPage({ params }: EditMarketingCompanyPageProps) {
  const { slug } = await params;
  const company = await getMarketingCompanyBySlug(slug);
  if (!company) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${company.name}`} subtitle="Update this marketing company's profile." />
        <CompanyProfileForm kind={kind} initialCompany={company} />
      </section>
    </div>
  );
}

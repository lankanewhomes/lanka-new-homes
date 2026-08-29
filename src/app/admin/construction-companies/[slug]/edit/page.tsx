import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { ConstructionCompanyForm } from "@/components/dashboard/construction-company-form";
import { getConstructionCompanyBySlug } from "@/lib/construction-company-store";

export const metadata: Metadata = {
  title: "Edit Construction Company",
  robots: {
    index: false,
    follow: false,
  },
};

type EditConstructionCompanyPageProps = { params: Promise<{ slug: string }> };

export default async function AdminEditConstructionCompanyPage({ params }: EditConstructionCompanyPageProps) {
  const { slug } = await params;
  const company = await getConstructionCompanyBySlug(slug);
  if (!company) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${company.name}`} subtitle="Update this construction company's profile." />
        <ConstructionCompanyForm initialCompany={company} />
      </section>
    </div>
  );
}

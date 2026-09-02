import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { CompanyProfileForm, type CompanyProfileFormKind } from "@/components/dashboard/company-profile-form";
import { getInteriorDesignerBySlug } from "@/lib/interior-designer-store";

export const metadata: Metadata = {
  title: "Edit Interior Designer",
  robots: {
    index: false,
    follow: false,
  },
};

const kind: CompanyProfileFormKind = {
  apiBase: "/api/interior-designers",
  listHref: "/admin/interior-designers",
  namePlaceholder: "e.g. Pulsinelli",
  entityLabel: "Interior Designer",
};

type EditInteriorDesignerPageProps = { params: Promise<{ slug: string }> };

export default async function AdminEditInteriorDesignerPage({ params }: EditInteriorDesignerPageProps) {
  const { slug } = await params;
  const designer = await getInteriorDesignerBySlug(slug);
  if (!designer) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${designer.name}`} subtitle="Update this interior designer's profile." />
        <CompanyProfileForm kind={kind} initialCompany={designer} />
      </section>
    </div>
  );
}

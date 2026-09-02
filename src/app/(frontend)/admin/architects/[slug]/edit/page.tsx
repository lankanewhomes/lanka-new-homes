import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { CompanyProfileForm, type CompanyProfileFormKind } from "@/components/dashboard/company-profile-form";
import { getArchitectBySlug } from "@/lib/architect-store";

export const metadata: Metadata = {
  title: "Edit Architect",
  robots: {
    index: false,
    follow: false,
  },
};

const kind: CompanyProfileFormKind = {
  apiBase: "/api/architects",
  listHref: "/admin/architects",
  namePlaceholder: "e.g. Kirkor Architects and Planners",
  entityLabel: "Architect",
};

type EditArchitectPageProps = { params: Promise<{ slug: string }> };

export default async function AdminEditArchitectPage({ params }: EditArchitectPageProps) {
  const { slug } = await params;
  const architect = await getArchitectBySlug(slug);
  if (!architect) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${architect.name}`} subtitle="Update this architect's profile." />
        <CompanyProfileForm kind={kind} initialCompany={architect} />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { CompanyProfileForm, type CompanyProfileFormKind } from "@/components/dashboard/company-profile-form";

export const metadata: Metadata = {
  title: "New Architect",
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

export default function AdminNewArchitectPage() {
  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title="New architect" subtitle="Add an architect profile that can be linked from a project's Connected Pages." />
        <CompanyProfileForm kind={kind} />
      </section>
    </div>
  );
}

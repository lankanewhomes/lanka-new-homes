import type { Metadata } from "next";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { ConstructionCompanyForm } from "@/components/dashboard/construction-company-form";

export const metadata: Metadata = {
  title: "New Construction Company",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminNewConstructionCompanyPage() {
  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title="New construction company" subtitle="Add a company profile shown on the public /construction-companies directory." />
        <ConstructionCompanyForm />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { LandWizard } from "@/components/dashboard/land-wizard";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";

export const metadata: Metadata = {
  title: "New Land Listing",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewLandPage() {
  const [developers, constructionCompanies] = await Promise.all([getAllDevelopers(), getAllConstructionCompanies()]);

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title="New land listing" subtitle="Fill in the wizard and publish when ready." />
        <LandWizard developers={developers} constructionCompanies={constructionCompanies} />
      </section>
    </div>
  );
}

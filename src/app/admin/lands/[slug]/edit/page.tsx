import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar } from "@/components/dashboard/components";
import { LandWizard } from "@/components/dashboard/land-wizard";
import { getLandBySlug } from "@/lib/land-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";

export const metadata: Metadata = {
  title: "Edit Land Listing",
  robots: {
    index: false,
    follow: false,
  },
};

type EditLandPageProps = { params: Promise<{ slug: string }> };

export default async function AdminEditLandPage({ params }: EditLandPageProps) {
  const { slug } = await params;
  const [land, developers, constructionCompanies] = await Promise.all([
    getLandBySlug(slug),
    getAllDevelopers(),
    getAllConstructionCompanies(),
  ]);
  if (!land) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${land.title}`} subtitle="Update this land listing's details." />
        <LandWizard initialLand={land} developers={developers} constructionCompanies={constructionCompanies} />
      </section>
    </div>
  );
}

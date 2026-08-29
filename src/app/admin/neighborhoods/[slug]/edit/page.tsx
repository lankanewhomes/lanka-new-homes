import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardHeader, DashboardSidebar, NeighborhoodForm } from "@/components/dashboard/components";
import { getNeighborhoodBySlug } from "@/lib/neighborhood-store";

export const metadata: Metadata = {
  title: "Edit Neighborhood",
  robots: {
    index: false,
    follow: false,
  },
};

type EditNeighborhoodPageProps = { params: Promise<{ slug: string }> };

export default async function EditNeighborhoodPage({ params }: EditNeighborhoodPageProps) {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);
  if (!neighborhood) return notFound();

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar />
      <section className="space-y-4">
        <DashboardHeader title={`Edit ${neighborhood.name}`} subtitle="Update this neighborhood's public page." />
        <NeighborhoodForm initialNeighborhood={neighborhood} />
      </section>
    </div>
  );
}

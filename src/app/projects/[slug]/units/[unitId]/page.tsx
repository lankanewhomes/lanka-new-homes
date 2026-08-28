import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug } from "@/lib/project-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { getUnitById } from "@/lib/unit-store";
import {
  ProjectHero,
  SalesCenterSection,
  StatusBadge,
} from "@/components/marketplace/components";
import { formatLkr } from "@/lib/format";

type UnitPageProps = {
  params: Promise<{ slug: string; unitId: string }>;
};

export async function generateMetadata({ params }: UnitPageProps): Promise<Metadata> {
  const { slug, unitId } = await params;
  const project = await getProjectBySlug(slug);
  const unit = project ? await getUnitById(slug, unitId) : undefined;

  if (!project || !unit) {
    return { title: "Unit Not Found", robots: { index: false, follow: false } };
  }

  return {
    title: `Unit ${unit.unitNumber} - ${project.name}`,
    description: `Unit ${unit.unitNumber} at ${project.name}: floor ${unit.floor}, ${unit.bedrooms} bedrooms, ${unit.areaSqFt} sq.ft, ${unit.status}.`,
    alternates: { canonical: `/projects/${project.slug}/units/${unit.id}` },
    robots: unit.status === "Sold" ? { index: false, follow: true } : undefined,
  };
}

export default async function UnitDetailPage({ params }: UnitPageProps) {
  const { slug, unitId } = await params;
  const project = await getProjectBySlug(slug);
  const unit = project ? await getUnitById(slug, unitId) : undefined;

  if (!project || !unit) return notFound();

  const floorPlan = project.floorPlans.find((plan) => plan.planType === unit.apartmentType);
  const developer = await getDeveloperBySlug(project.developerSlug);

  return (
    <div className="space-y-8">
      <ProjectHero
        project={project}
        titleOverride={`Unit ${unit.unitNumber}`}
        heroImageOverride={floorPlan?.image ?? project.heroImage}
        showAmenitiesAndNeighborhoodNav={false}
        backHref={floorPlan ? `/projects/${project.slug}/floor-plans/${floorPlan.id}` : `/projects/${project.slug}`}
        backLabel={floorPlan ? floorPlan.planName : project.name}
      />

      <div className="listing-with-sidebar">
        <div className="listing-with-sidebar-main space-y-4">
          <h2 className="text-2xl font-normal text-stone-900">Unit {unit.unitNumber}</h2>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div className="border border-stone-200 bg-white p-3">
              <p className="text-xs text-stone-500">Status</p>
              <StatusBadge status={unit.status} />
            </div>
            <div className="border border-stone-200 bg-white p-3">
              <p className="text-xs text-stone-500">Floor</p>
              <p className="text-sm font-medium text-stone-900">{unit.floor}</p>
            </div>
            <div className="border border-stone-200 bg-white p-3">
              <p className="text-xs text-stone-500">Type</p>
              <p className="text-sm font-medium text-stone-900">{unit.apartmentType}</p>
            </div>
            <div className="border border-stone-200 bg-white p-3">
              <p className="text-xs text-stone-500">Bedrooms</p>
              <p className="text-sm font-medium text-stone-900">{unit.bedrooms}</p>
            </div>
            <div className="border border-stone-200 bg-white p-3">
              <p className="text-xs text-stone-500">Area</p>
              <p className="text-sm font-medium text-stone-900">{unit.areaSqFt} sq.ft</p>
            </div>
            <div className="border border-stone-200 bg-white p-3">
              <p className="text-xs text-stone-500">Price</p>
              <p className="text-sm font-medium text-stone-900">{formatLkr(unit.priceLkr)}{unit.priceUsd ? ` (US$${unit.priceUsd.toLocaleString()})` : ""}</p>
            </div>
          </div>

          {floorPlan ? (
            <p className="text-sm text-stone-600">
              Part of the <Link href={`/projects/${project.slug}/floor-plans/${floorPlan.id}`} className="underline">{floorPlan.planName}</Link> floor plan.
            </p>
          ) : null}
        </div>
      </div>

      <SalesCenterSection project={project} developer={developer} />
    </div>
  );
}

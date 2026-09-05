import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CircleDollarSign, Compass, HousePlus, Layers, MapPin, Ruler } from "lucide-react";
import { getLandBySlug } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { formatLkr } from "@/lib/format";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import {
  AmenitiesShowcaseSection,
  KeyFeaturesSection,
  NeighborhoodSection,
  PlansAndHomesSection,
  PricingInformationLayout,
  ProjectHero,
  StatsContactCard,
} from "@/components/marketplace/components";
import type { Developer } from "@/types";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type LandPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: LandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const land = await getLandBySlug(slug);

  if (!land) {
    return { title: "Land Listing Not Found", robots: { index: false, follow: false } };
  }

  return {
    title: `${land.title} - Land for Sale in ${land.location}`,
    description: land.summary,
    alternates: { canonical: `/land/${land.slug}` },
    robots: land.status === "Sold" ? { index: false, follow: true } : undefined,
  };
}

export default async function LandDetailPage({ params }: LandPageProps) {
  const { slug } = await params;
  const land = await getLandBySlug(slug);
  if (!land) return notFound();

  const project = landToProjectShape(land);

  let developer: Developer | undefined;
  if (land.sellerType === "developer" && land.sellerSlug) {
    developer = await getDeveloperBySlug(land.sellerSlug);
  } else if (land.sellerType === "construction_company" && land.sellerSlug) {
    const companies = await getAllConstructionCompanies();
    const company = companies.find((entry) => entry.slug === land.sellerSlug);
    if (company) {
      developer = {
        slug: company.slug,
        name: company.name,
        logo: company.logo,
        description: company.description,
        location: company.location,
        establishedYear: 0,
        yearsInBusiness: company.yearsInBusiness ?? 0,
        activeProjects: 0,
        completedProjects: 0,
        website: company.website ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
        socialLinks: company.socialLinks,
      };
    }
  }

  const plots = land.plots ?? [];
  const totalPlots = plots.length;
  const plotsAvailable = plots.filter((plot) => plot.status === "Available").length;
  const plotsSold = plots.filter((plot) => plot.status === "Sold").length;

  const stats: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: HousePlus, label: "Listing status", value: land.status },
    { icon: CircleDollarSign, label: "Price range", value: land.priceLkr > 0 ? formatLkr(land.priceLkr) : (project.priceRange || "Contact for pricing") },
    { icon: MapPin, label: "Address", value: land.location },
    ...(totalPlots > 0 ? [{ icon: Layers, label: "Total plots", value: String(totalPlots) }] : []),
    ...(totalPlots > 0 ? [{ icon: Compass, label: "Plots available", value: String(plotsAvailable) }] : []),
    ...(totalPlots > 0 ? [{ icon: Layers, label: "Plots sold", value: String(plotsSold) }] : []),
    ...(land.landSizePerches > 0 ? [{ icon: Ruler, label: "Land size", value: `${land.landSizePerches} perches` }] : []),
    { icon: Compass, label: "Land use", value: land.landUse.join(" & ") },
  ];

  const detailRows = [
    { label: "Land use", value: land.landUse.join(", ") },
    { label: "Land type", value: land.landType },
    { label: "Shape of land", value: land.landShape },
    { label: "Status", value: land.status },
    { label: "Plots", value: totalPlots > 0 ? `${plotsAvailable} available of ${totalPlots} total` : undefined },
    { label: "District", value: land.district },
    { label: "City", value: land.city },
    { label: "Province", value: land.province },
    { label: "Road access", value: land.roadAccess },
    { label: "Road width", value: land.roadWidthFt ? `${land.roadWidthFt} ft` : undefined },
    { label: "Electricity", value: land.electricity },
    { label: "Water", value: land.water },
    { label: "Title / deed", value: land.titleType },
    { label: "Survey plan", value: land.surveyPlanStatus },
    { label: "Seller", value: land.sellerName },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  const DETAIL_PER_ROW = 2;
  const detailRowGroups: (typeof detailRows)[number][][] = [];
  for (let i = 0; i < detailRows.length; i += DETAIL_PER_ROW) detailRowGroups.push(detailRows.slice(i, i + DETAIL_PER_ROW));

  return (
    <div className="space-y-8">
      <ProjectHero
        project={project}
        backHref="/land"
        backLabel="Land for Sale"
        statusLabelOverride={land.status}
        extraBadges={land.badges ?? []}
        plansHomesNavLabel="Plots"
        amenitiesNavLabel="Facilities"
        roadMapImages={land.roadMapImages ?? []}
        blockPlanImages={land.blockPlanImages ?? []}
        videoLinks={land.videos ?? []}
        requestInfoVariant="inquiry"
      />

      <div className="project-page-content">
        <div className="listing-hero-stats-chips land-stats-chips" role="list" aria-label="Land summary stats">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} role="listitem" className="listing-hero-stat-chip">
                <Icon className="listing-hero-stat-chip-icon" aria-hidden="true" />
                <div className="listing-hero-stat-chip-content">
                  <span className="listing-hero-stat-chip-value">{stat.value}</span>
                  <span className="listing-hero-stat-chip-label">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {land.description ? (
          <section id="overview" className="project-description-shell" aria-label="Overview">
            <h2>Overview</h2>
            <p style={{ whiteSpace: "pre-line" }}>{land.description}</p>
          </section>
        ) : null}

        {detailRows.length > 0 ? (
          <section className="project-narrative-shell" aria-label="Land details">
            <table className="project-fact-sheet">
              <tbody>
                {detailRowGroups.map((group) => (
                  <tr key={group[0].label}>
                    {group.map(({ label, value }) => (
                      <td key={label}><span className="project-fact-label">{label}:</span> {value}</td>
                    ))}
                    {group.length < DETAIL_PER_ROW ? <td aria-hidden="true" /> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <PlansAndHomesSection project={project} title="Plots" showQuickMoveIns={false} showBedBath={false} planHrefBase={`/land/${land.slug}/plots`} />

        <section id="pricing" className="space-y-3">
          <PricingInformationLayout project={project} />
        </section>

        <KeyFeaturesSection unitFeatures={project.unitFeatures} />

        <AmenitiesShowcaseSection amenities={project.amenities} gallery={project.gallery} heroImage={project.heroImage} title="Facilities" />

        {land.gallery.length > 0 ? (
          <section id="gallery" className="project-description-shell" aria-label="Gallery">
            <h2>Gallery</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {land.gallery.map((item, index) => (
                <div key={`${item.image}-${index}`} className="relative aspect-4/3 overflow-hidden bg-stone-100">
                  <Image src={item.image} alt={item.label || land.title} fill className="object-cover" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <NeighborhoodSection nearby={project.nearby} neighborhoodName={project.neighborhood} neighborhoodSlug={undefined} neighborhoodPageExists={false} />

        <StatsContactCard project={project} developer={developer} requestInfoVariant="inquiry" />
      </div>
    </div>
  );
}

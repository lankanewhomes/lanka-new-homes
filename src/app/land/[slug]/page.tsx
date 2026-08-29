import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CircleDollarSign, Compass, HousePlus, Layers, MapPin, Ruler } from "lucide-react";
import { getLandBySlug } from "@/lib/land-store";
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
import type { Developer, FloorPlan, Land, Project, ProjectStatus } from "@/types";

type LandPageProps = { params: Promise<{ slug: string }> };

// Design stays identical to the project detail page (ProjectHero, stats
// chips, overview, details table, pricing, key features, amenities, floor
// plans, neighborhood, contact card) — only the data source changes. This
// adapter maps a `Land` record onto the `Project` shape those shared
// components expect, filling fields Land doesn't have with safe,
// non-misleading defaults ("-", 0, empty arrays) rather than fabricated
// values.
function landStatusToProjectStatus(status: Land["status"]): ProjectStatus {
  if (status === "Sold") return "Nearly Sold Out";
  if (status === "Reserved") return "Under Construction";
  return "Now Selling";
}

function formatPerchPriceRange(min?: number, max?: number): string {
  if (min && max && min !== max) return `${min.toLocaleString()} - ${max.toLocaleString()} per perch`;
  if (min || max) return `${(min ?? max ?? 0).toLocaleString()} per perch`;
  return "";
}

function landToProjectShape(land: Land): Project {
  const floorPlans: FloorPlan[] = (land.plots ?? []).map((plot) => ({
    id: plot.id,
    planName: plot.name,
    bedrooms: 0,
    bathrooms: 0,
    floorAreaSqFt: plot.sizePerches,
    startingPriceLkr: plot.priceLkr,
    image: land.heroImage,
    availability: plot.status === "Available" ? "Available" : plot.status === "Sold" ? "Sold Out" : "Limited",
  }));

  return {
    slug: land.slug,
    name: land.title,
    developerSlug: land.sellerSlug ?? "",
    developerName: land.sellerName,
    location: land.location,
    district: land.district,
    city: land.city,
    province: land.province,
    neighborhood: land.city,
    type: land.landUse,
    status: landStatusToProjectStatus(land.status),
    isFeatured: land.isFeatured,
    launchDate: "",
    completionYear: 0,
    constructionStatus: "",
    startingPriceLkr: land.priceLkr > 0 ? land.priceLkr : (land.pricePerPerchLkrMin ?? 0),
    priceRange: land.priceLkr > 0 ? land.priceLkr.toLocaleString() : formatPerchPriceRange(land.pricePerPerchLkrMin, land.pricePerPerchLkrMax),
    bedrooms: "-",
    bathrooms: "-",
    floorAreaRange: land.landSizePerches > 0 ? `${land.landSizePerches} perches` : "-",
    units: floorPlans.length,
    floors: 0,
    parking: "-",
    security: "-",
    ownership: land.titleType ?? "-",
    paymentPlan: "",
    paymentPlanItems: land.paymentPlanItems,
    road: land.roadAccess,
    electricity: land.electricity,
    tapWater: land.water,
    summary: land.summary,
    description: land.description,
    heroImage: land.heroImage,
    gallery: land.gallery,
    amenities: land.amenities ?? [],
    unitFeatures: land.unitFeatures,
    floorPlans,
    nearby: land.nearby,
    coordinates: land.coordinates,
    contact: land.contact,
  };
}

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
    { icon: Compass, label: "Land use", value: land.landUse },
  ];

  const detailRows = [
    { label: "Land use", value: land.landUse },
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
        roadMapImages={land.roadMapImages ?? []}
        blockPlanImages={land.blockPlanImages ?? []}
        videoLinks={land.videos ?? []}
        requestInfoVariant="inquiry"
      />

      <div className="project-page-content">
        <div className="listing-hero-stats-chips" role="list" aria-label="Land summary stats">
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

        <PlansAndHomesSection project={project} title="Plots" showQuickMoveIns={false} />

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

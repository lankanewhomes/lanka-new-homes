import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Building2, Compass, Landmark, MapPin } from "lucide-react";
import { getAllNeighborhoods, getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { getAllProjects } from "@/lib/project-store";
import { toAbsoluteUrl } from "@/lib/seo";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { KnownLandmarksSection, NearbyPlacesAccordion, TruncatedDescription } from "@/components/marketplace/components";
import { groupNearbyPlaces } from "@/lib/nearby-places";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type NeighborhoodPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const neighborhoods = await getAllNeighborhoods();
  return neighborhoods.map((neighborhood) => ({ slug: neighborhood.slug }));
}

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);

  if (!neighborhood) {
    return { title: "Neighborhood Not Found", robots: { index: false, follow: false } };
  }

  const title = `${neighborhood.name} Neighborhood Guide - New Homes in ${neighborhood.city}`;
  const canonicalPath = `/neighborhoods/${neighborhood.slug}`;

  return {
    title,
    description: neighborhood.description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description: neighborhood.description,
      url: canonicalPath,
      images: [{ url: neighborhood.heroImage, alt: neighborhood.name }],
    },
  };
}

export default async function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);
  if (!neighborhood) return notFound();

  const allProjects = await getAllProjects();
  const neighborhoodProjects = allProjects.filter((project) => project.neighborhoodSlug === slug);
  const nearbyGroups = groupNearbyPlaces(neighborhood.nearby ?? []);
  const highlights = (neighborhood.highlights ?? []).filter(Boolean);
  const landmarkCount = (neighborhood.nearby ?? []).filter((place) => place.category !== "School" && place.category !== "Transport").length;

  const stats: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: Compass, label: "Province", value: neighborhood.province },
    ...(neighborhoodProjects.length > 0 ? [{ icon: Building2, label: "New homes", value: String(neighborhoodProjects.length) }] : []),
    ...(landmarkCount > 0 ? [{ icon: Landmark, label: "Known landmarks", value: String(landmarkCount) }] : []),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: neighborhood.name,
    description: neighborhood.description,
    url: toAbsoluteUrl(`/neighborhoods/${neighborhood.slug}`),
    image: neighborhood.heroImage,
    address: { "@type": "PostalAddress", addressLocality: neighborhood.city, addressRegion: neighborhood.province, addressCountry: "LK" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* Same hero/panel shell as the project and land detail pages
          (.listing-hero photo + a floating .listing-hero-panel title card)
          instead of the neighborhood's old bespoke text-over-photo banner —
          see docs/design.md's "Land detail page" convention: any new
          single-item detail page reuses this class set rather than a new
          bespoke layout. */}
      <section className="listing-hero">
        <div className="listing-hero-media" style={{ height: 560 }}>
          <Image src={neighborhood.heroImage} alt={neighborhood.name} fill priority sizes="(max-width: 900px) 100vw, 1290px" style={{ objectFit: "cover" }} />
        </div>

        <div className="listing-hero-panel">
          <div className="listing-hero-title-wrap">
            <h1>{neighborhood.name}</h1>
            <p className="listing-hero-location-line"><MapPin size={14} aria-hidden="true" />{neighborhood.city}, {neighborhood.province}</p>
          </div>
        </div>
      </section>

      <div className="project-page-content">
        {stats.length > 0 ? (
          <div className="listing-hero-stats-chips" role="list" aria-label="Neighborhood summary stats">
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
        ) : null}

        <section id="overview" className="project-description-shell" aria-label="Overview">
          <h2>Overview</h2>
          {highlights.length > 0 ? (
            <ul className="project-description-highlights">
              {highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          ) : null}
          <TruncatedDescription text={neighborhood.description} />
        </section>

        <KnownLandmarksSection nearby={neighborhood.nearby ?? []} />

        <section className="developer-projects-section">
          <h2>New homes in {neighborhood.name}</h2>
          {neighborhoodProjects.length === 0 ? (
            <p className="developer-empty-note">No projects listed in this neighborhood yet.</p>
          ) : (
            <div className="home-card-grid developer-projects-grid">
              {neighborhoodProjects.map((project) => (
                <ListingGridCard key={project.slug} project={project} />
              ))}
            </div>
          )}
        </section>

        {nearbyGroups.length > 0 ? (
          <section id="whats-nearby" className="key-features-shell" aria-label="What's nearby">
            <div className="key-features-pattern" aria-hidden="true" />
            <h2>What&apos;s Nearby</h2>
            <NearbyPlacesAccordion groups={nearbyGroups} />
          </section>
        ) : null}
      </div>
    </>
  );
}

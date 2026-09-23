import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Building2, Compass, Home, Map as MapIcon, MapPin, Route } from "lucide-react";
import { getAllNeighborhoods, getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { getAllProjects } from "@/lib/project-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { buildFaqJsonLd, jsonLdScriptProps, toAbsoluteUrl } from "@/lib/seo";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { KnownLandmarksSection, NearbyPlacesAccordion, TruncatedDescription } from "@/components/marketplace/components";
import { NeighborhoodQuickjumpBar, type NeighborhoodQuickjumpItem } from "@/components/marketplace/neighborhood-quickjump";
import { NeighborhoodHeroGallery } from "@/components/marketplace/neighborhood-hero-gallery";
import type { MapPlace } from "@/components/marketplace/map-pane";
import { groupNearbyPlaces } from "@/lib/nearby-places";
import { buildNeighborhoodFaqs, propertyTypeLabels } from "@/lib/neighborhood-faq";
import type { NearbyPlace } from "@/types";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type NeighborhoodPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const neighborhoods = await getAllNeighborhoods();
  return neighborhoods.map((neighborhood) => ({ slug: neighborhood.slug }));
}

// The overview is 300+ words, so meta/structured-data descriptions use just its first sentences.
function excerpt(text: string, max = 200): string {
  const first = (text.split(/\n{2,}/)[0] ?? "").replace(/\s+/g, " ").trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const stop = cut.lastIndexOf(". ");
  return stop > 80 ? cut.slice(0, stop + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Places worth a marker, most useful first; roads are lines and access points are far away, so neither is pinned.
const MAP_PLACE_ORDER: NearbyPlace["category"][] = ["Landmark", "Hospital", "Shopping", "Business", "School", "Transport", "Restaurant"];
const MAP_PLACE_LIMIT = 24;

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);

  if (!neighborhood) {
    return { title: "Neighborhood Not Found", robots: { index: false, follow: false } };
  }

  const title = `${neighborhood.name} Neighborhood Guide - New Homes in ${neighborhood.city}`;
  const canonicalPath = `/neighborhoods/${neighborhood.slug}`;
  const description = excerpt(neighborhood.description);

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      images: [{ url: neighborhood.heroImage, alt: neighborhood.name }],
    },
  };
}

export default async function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);
  if (!neighborhood) return notFound();

  const [allProjects, allNeighborhoods] = await Promise.all([getAllProjects(), getAllNeighborhoods()]);
  const neighborhoodProjects = allProjects.filter((project) => project.neighborhoodSlug === slug);
  const nearbyGroups = groupNearbyPlaces(neighborhood.nearby ?? [], { neighborhood: true });
  const highlights = (neighborhood.highlights ?? []).filter(Boolean);
  const allPhotos = (neighborhood.gallery ?? []).filter((photo) => photo.url);
  // A photo tied to a Known Landmark shows in that section; the rest form the Photos section.
  const landmarkPhotos = allPhotos.filter((photo) => photo.landmark);
  const gallery = allPhotos.filter((photo) => !photo.landmark);
  // Hero shows the main photo plus up to 4 gallery shots beside it (3-5 images total,
  // depending on how many the page has) instead of a single static banner photo.
  const heroSideImages = allPhotos.slice(0, 4);

  // Developers of the listed projects, with the projects each one has here.
  const developerSlugs = Array.from(new Set(neighborhoodProjects.map((project) => project.developerSlug).filter(Boolean)));
  const developers = (await Promise.all(developerSlugs.map((developerSlug) => getDeveloperBySlug(developerSlug))))
    .filter((developer): developer is NonNullable<typeof developer> => Boolean(developer))
    .map((developer) => ({ developer, projects: neighborhoodProjects.filter((project) => project.developerSlug === developer.slug) }));

  // Other neighborhoods: a name that matches one of our pages links to it.
  const nearbyAreas = (neighborhood.nearbyAreas ?? []).filter(Boolean).map((areaName) => {
    const match = allNeighborhoods.find((other) => other.slug !== slug && other.name.trim().toLowerCase() === areaName.trim().toLowerCase());
    return { name: areaName, slug: match?.slug };
  });

  // Map: the approximate area, the projects' pins and the nearby places that have coordinates.
  const hasCentre = typeof neighborhood.latitude === "number" && typeof neighborhood.longitude === "number";
  const area = hasCentre
    ? { lat: neighborhood.latitude as number, lng: neighborhood.longitude as number, radiusKm: neighborhood.mapRadiusKm ?? 2, label: neighborhood.name }
    : undefined;
  const pinnedProjects = neighborhoodProjects.filter((project) => project.coordinates?.lat != null && project.coordinates?.lng != null);
  const maxPlaceKm = Math.max(5, (neighborhood.mapRadiusKm ?? 2) * 2.5);
  const mapPlaces: MapPlace[] = area
    ? MAP_PLACE_ORDER.flatMap((category) =>
        (neighborhood.nearby ?? [])
          .filter((place) => place.category === category && typeof place.lat === "number" && typeof place.lng === "number")
          .filter((place) => distanceKm({ lat: area.lat, lng: area.lng }, { lat: place.lat as number, lng: place.lng as number }) <= maxPlaceKm)
          .map((place) => ({ name: place.name, category: place.category, lat: place.lat as number, lng: place.lng as number })),
      ).slice(0, MAP_PLACE_LIMIT)
    : [];
  const showMap = Boolean(area) || pinnedProjects.length > 0;

  const faqs = buildNeighborhoodFaqs(neighborhood, neighborhoodProjects);

  // Quick facts — chips, no heading. A fact that has no data is left out.
  const propertyTypes = propertyTypeLabels(neighborhoodProjects);
  const stats: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    ...(neighborhood.district ? [{ icon: MapIcon, label: "District", value: neighborhood.district }] : []),
    ...(neighborhood.city ? [{ icon: MapPin, label: "City", value: neighborhood.city }] : []),
    ...(neighborhood.approxLocation ? [{ icon: Compass, label: "Approx. location", value: neighborhood.approxLocation }] : []),
    ...(nearbyAreas.length > 0 ? [{ icon: Route, label: "Nearby major areas", value: nearbyAreas.slice(0, 3).map((areaItem) => areaItem.name).join(", ") }] : []),
    ...(propertyTypes.length > 0 ? [{ icon: Home, label: "Typical property types", value: propertyTypes.join(", ") }] : []),
    ...(neighborhoodProjects.length > 0 ? [{ icon: Building2, label: "New projects", value: String(neighborhoodProjects.length) }] : []),
  ];

  const whatsNearbySection = nearbyGroups.length > 0 ? (
    <section id="whats-nearby" className="key-features-shell" aria-label="What's nearby">
      <div className="key-features-pattern" aria-hidden="true" />
      <h2>What&apos;s Nearby</h2>
      <NearbyPlacesAccordion groups={nearbyGroups} />
    </section>
  ) : null;

  const totalPhotoCount = 1 + allPhotos.length; // hero image + gallery
  // No "Map" entry — the location map only lives inside the hero's popup now (owner,
  // 2026-09-23), not as its own scrollable page section, so there's no anchor for it to jump to.
  const quickjumpItems: NeighborhoodQuickjumpItem[] = [
    { key: "overview", href: "#overview", label: "Overview", show: true },
    { key: "photos", href: "#known-landmarks", label: "Photos", show: totalPhotoCount > 1 },
    { key: "projects", href: "#projects", label: "New homes", show: neighborhoodProjects.length > 0 },
    { key: "landmarks", href: "#known-landmarks", label: "Landmarks", show: (neighborhood.nearby ?? []).length > 0 },
    { key: "faq", href: "#faq", label: "FAQ", show: faqs.length > 0 },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: neighborhood.name,
    description: excerpt(neighborhood.description),
    url: toAbsoluteUrl(`/neighborhoods/${neighborhood.slug}`),
    image: neighborhood.heroImage,
    address: { "@type": "PostalAddress", addressLocality: neighborhood.city, addressRegion: neighborhood.province, addressCountry: "LK" },
    ...(hasCentre ? { geo: { "@type": "GeoCoordinates", latitude: neighborhood.latitude, longitude: neighborhood.longitude } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {faqs.length > 0 ? <script {...jsonLdScriptProps(buildFaqJsonLd(faqs))} /> : null}

      {/* Same hero/panel shell as the project and land detail pages
          (.listing-hero photo + a floating .listing-hero-panel title card)
          instead of the neighborhood's old bespoke text-over-photo banner —
          see docs/design.md's "Land detail page" convention: any new
          single-item detail page reuses this class set rather than a new
          bespoke layout. */}
      <section className="listing-hero">
        <div className="listing-hero-media" style={{ height: 560 }}>
          <NeighborhoodHeroGallery
            name={neighborhood.name}
            location={`${neighborhood.city}, ${neighborhood.province}`}
            heroImage={{ url: neighborhood.heroImage, caption: neighborhood.name }}
            sideImages={heroSideImages.map((photo) => ({ url: photo.url, caption: photo.caption }))}
            galleryPhotos={allPhotos.map((photo) => ({ url: photo.url, caption: photo.caption }))}
            map={showMap ? { projects: neighborhoodProjects, area, places: mapPlaces } : undefined}
          />
        </div>

        <div className="listing-hero-panel" id="neighborhood-hero-title-panel">
          <div className="listing-hero-title-wrap">
            <h1>{neighborhood.name}</h1>
            <p className="listing-hero-location-line"><MapPin size={14} aria-hidden="true" />{neighborhood.city}, {neighborhood.province}</p>
          </div>
        </div>
      </section>

      <NeighborhoodQuickjumpBar titlePanelId="neighborhood-hero-title-panel" items={quickjumpItems} />

      <div className="project-page-content">
        {stats.length > 0 ? (
          <div className="listing-hero-stats-chips neighborhood-stats-chips" role="list" aria-label="Neighborhood summary">
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

        {/* What is this area? */}
        <section id="overview" className="project-description-shell" aria-label="About the neighbourhood">
          <h2>About the neighbourhood</h2>
          {highlights.length > 0 || neighborhood.population ? (
            <ul className="project-description-highlights">
              {neighborhood.population ? <li key="population">Population: {neighborhood.population}</li> : null}
              {highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          ) : null}
          <TruncatedDescription text={neighborhood.description} paragraphs />
          {/* The "Source: …" line is intentionally not rendered (owner, 2026-09-21) — the
              `sources` data itself stays on the doc (CMS field, Supabase column) in case it's
              wanted again later, e.g. on an admin view; the public page just doesn't show it. */}
        </section>

        {gallery.length > 0 ? (
          <section id="photos" className="project-description-shell" aria-label={`Photos of ${neighborhood.name}`}>
            <h2>Photos of {neighborhood.name}</h2>
            <div className="neighborhood-gallery-grid">
              {gallery.map((photo, index) => (
                <figure key={photo.url} className={`neighborhood-gallery-item${index === 0 ? " neighborhood-gallery-item-lead" : ""}`}>
                  <div className="neighborhood-gallery-frame">
                    <Image
                      src={photo.url}
                      alt={photo.caption ? `${photo.caption}, ${neighborhood.name}` : `${neighborhood.name}`}
                      fill
                      sizes={index === 0 ? "(max-width: 900px) 100vw, 840px" : "(max-width: 900px) 50vw, 420px"}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  {photo.caption || photo.credit ? (
                    <figcaption>
                      {photo.caption ? <span className="neighborhood-gallery-caption">{photo.caption}</span> : null}
                      {photo.credit ? (
                        photo.sourceUrl ? (
                          <a className="neighborhood-gallery-credit" href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">{photo.credit}</a>
                        ) : (
                          <span className="neighborhood-gallery-credit">{photo.credit}</span>
                        )
                      ) : null}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {neighborhood.heroImageCredit ? (
          <p className="neighborhood-hero-credit">
            Header photo:{" "}
            {neighborhood.heroImageSourceUrl ? (
              <a href={neighborhood.heroImageSourceUrl} target="_blank" rel="noopener noreferrer">{neighborhood.heroImageCredit.replace(/^Photo:\s*/i, "")}</a>
            ) : (
              neighborhood.heroImageCredit.replace(/^Photo:\s*/i, "")
            )}
          </p>
        ) : null}

        {/* What new projects are here? */}
        <section id="projects" className="developer-projects-section">
          <h2>New homes and projects in the neighbourhood</h2>
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

        {/* Who are the developers? */}
        {developers.length > 0 ? (
          <section id="developers" className="developer-projects-section">
            <h2>Developers building in the neighbourhood</h2>
            <div className="neighborhood-developers-grid">
              {developers.map(({ developer, projects }) => (
                <Link key={developer.slug} href={`/developers/${developer.slug}`} className="neighborhood-developer-card">
                  {developer.logo ? <Image src={developer.logo} alt={developer.name} width={120} height={60} className="neighborhood-developer-logo" /> : null}
                  <span className="neighborhood-developer-copy">
                    <strong>{developer.name}</strong>
                    <span>{projects.length} {projects.length === 1 ? "project" : "projects"} here: {projects.map((project) => project.name).join(", ")}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* What can I find nearby? */}
        <KnownLandmarksSection
          nearby={neighborhood.nearby ?? []}
          photos={landmarkPhotos.map((photo) => ({ landmark: photo.landmark as string, url: photo.url, caption: photo.caption, credit: photo.credit, sourceUrl: photo.sourceUrl }))}
        />

        {whatsNearbySection}

        {faqs.length > 0 ? (
          <section id="faq" className="project-description-shell" aria-label="Frequently asked questions">
            <h2>Frequently Asked Questions</h2>
            {faqs.map((faq) => (
              <details key={faq.question} className="guide-page-faq-item">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </section>
        ) : null}

        {/* What other neighbourhoods are nearby? */}
        {nearbyAreas.length > 0 ? (
          <section id="nearby-areas" className="project-description-shell" aria-label="Nearby areas">
            <h2>Explore nearby areas</h2>
            <ul className="neighborhood-nearby-areas">
              {nearbyAreas.map((areaItem) => (
                <li key={areaItem.name}>
                  {areaItem.slug ? <Link href={`/neighborhoods/${areaItem.slug}`}>{areaItem.name}</Link> : <span>{areaItem.name}</span>}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { landsInArea } from "@/lib/area-lands";
import { formatCodes, getPostalTown, nearestTowns, postalDistrictPath, postalTownForArea, postalTownPath } from "@/lib/postal-codes";
import { buildBreadcrumbJsonLd, jsonLdScriptProps, withSocial } from "@/lib/seo";

// "<Town> postal code" (2026-11-24). The code, district, province and nearby towns come from the static Sri Lanka Post town
// list (src/lib/postal-codes.ts); the homes and land counts are live. Pages are built the first time they are visited.
export const revalidate = 3600;

type Props = { params: Promise<{ district: string; town: string }> };

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district, town: townSlug } = await params;
  const town = getPostalTown(district, townSlug);
  if (!town) return { title: "Postal Code Not Found", robots: { index: false, follow: false } };
  const path = postalTownPath(town);
  const codes = formatCodes(town);
  return withSocial({
    title: `${town.name} Postal Code: ${codes} (${town.district} District)`,
    description: `The postal code (zip code) of ${town.name}, Sri Lanka is ${codes}. ${town.name} is in ${town.district} district, ${town.province} Province. See nearby postal codes and homes and land for sale in the area.`,
    alternates: { canonical: path },
  }, { path });
}

export default async function PostalTownPage({ params }: Props) {
  const { district, town: townSlug } = await params;
  const town = getPostalTown(district, townSlug);
  if (!town) return notFound();

  const codes = formatCodes(town);
  const plural = town.codes.length > 1;
  const nearby = nearestTowns(town, 12);
  // The code itself needs no database, so a failed listings read must not take the page down: it just shows no counts.
  const [neighborhoods, projects, lands] = await Promise.all([
    getAllNeighborhoods().catch(() => []),
    getAllProjects().catch(() => []),
    getAllLands().catch(() => []),
  ]);
  const area = neighborhoods.find((candidate) => postalTownForArea(candidate) === town);
  const homes = area ? projects.filter((project) => project.neighborhoodSlug === area.slug).length : 0;
  const plots = landsInArea(lands, area ?? { name: town.name, slug: town.slug }).length;
  const hasMap = Boolean(town.latitude && town.longitude);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${town.latitude},${town.longitude}`;

  const facts: { label: string; value: string }[] = [
    { label: plural ? "Postal codes" : "Postal code", value: codes },
    { label: "District", value: town.district },
    { label: "Province", value: `${town.province} Province` },
    ...(town.nameSi ? [{ label: "Name in Sinhala", value: town.nameSi }] : []),
    ...(town.nameTa ? [{ label: "Name in Tamil", value: town.nameTa }] : []),
    { label: "Country", value: "Sri Lanka" },
  ];

  const breadcrumb = buildBreadcrumbJsonLd([
    { label: "Home", href: "/" },
    { label: "Postal codes", href: "/postal-codes" },
    { label: `${town.district} district`, href: postalDistrictPath(town.districtSlug) },
    { label: town.name, href: postalTownPath(town) },
  ]);
  const place = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: town.name,
    address: { "@type": "PostalAddress", addressLocality: town.name, addressRegion: `${town.province} Province`, postalCode: town.codes[0], addressCountry: "LK" },
    ...(hasMap ? { geo: { "@type": "GeoCoordinates", latitude: town.latitude, longitude: town.longitude } } : {}),
  };

  return (
    <div className="fdv-page">
      <script {...jsonLdScriptProps(breadcrumb)} />
      <script {...jsonLdScriptProps(place)} />
      <section className="fdv-hero fdv-hero--split" aria-label={`${town.name} postal code`}>
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">{town.name} postal code: {codes}.</h1>
            <p className="fdv-hero-sub">
              The postal {plural ? "codes" : "code"} (zip code) of {town.name}, Sri Lanka {plural ? "are" : "is"} {codes}. {town.name} is in {town.district} district,
              in the {town.province} Province.{plural ? ` ${town.name} has more than one post office, so check which one delivers to your address.` : ""}
            </p>
            <div className="fdv-hero-ctas">
              <Link href={postalDistrictPath(town.districtSlug)} className="fdv-cta-final-button">All {town.district} postal codes</Link>
              {area ? <Link href={`/neighborhoods/${area.slug}`} className="fdv-cta-secondary fdv-hero-explore-link">{area.name} area guide</Link> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" aria-label={`${town.name} at a glance`}>
        <div className="wdx-section-head" data-reveal>
          <h2>{town.name} at a glance.</h2>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {facts.map((fact) => (
            <div key={fact.label} className="fdv-box-card">
              <h3>{fact.value}</h3>
              <p>{fact.label}</p>
            </div>
          ))}
        </div>
        <p data-reveal style={{ marginTop: 24 }}>
          To address post to {town.name}, write the name and street, then <strong>{town.name}</strong> and the postal code{" "}
          <strong>{town.codes[0]}</strong> on the next line, then Sri Lanka for post from overseas. Online forms that ask for a zip code
          or postcode want the same five digits.
          {hasMap ? <> <a href={mapUrl} target="_blank" rel="noopener noreferrer">See {town.name} on Google Maps</a>.</> : null}
        </p>
      </section>

      {nearby.length > 0 ? (
        <section className="fdv-box fdv-box--sage" aria-label={`Postal codes near ${town.name}`}>
          <div className="wdx-section-head" data-reveal>
            <h2>Postal codes near {town.name}.</h2>
            <p>The closest towns, nearest first</p>
          </div>
          <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
            {nearby.map(({ town: other, km }) => (
              <Link key={postalTownPath(other)} href={postalTownPath(other)} className="fdv-box-card fdv-box-card-link">
                <h3>{other.name}</h3>
                <p>Postal code {formatCodes(other)} · about {km < 1 ? "1" : Math.round(km)} km away</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="fdv-box fdv-box--cream" aria-label={`Homes and land in ${town.name}`}>
        <div className="wdx-section-head" data-reveal>
          <h2>Homes and land for sale in {town.name}.</h2>
        </div>
        <p data-reveal>
          {homes + plots > 0
            ? `LankaNewHomes lists ${homes} new ${homes === 1 ? "home" : "homes"} and ${plots} land ${plots === 1 ? "plot" : "plots"} in ${town.name} right now, direct from developers and builders. `
            : `No new homes or land plots are listed in ${town.name} right now. `}
          {area ? <>See the <Link href={`/neighborhoods/${area.slug}`}>{area.name} area guide</Link> for the listings, landmarks and what the area is like. </> : null}
          You can also browse <Link href="/projects">new homes for sale in Sri Lanka</Link>, <Link href="/land">land for sale</Link> or{" "}
          <Link href="/neighborhoods">all areas</Link>.
        </p>
      </section>
    </div>
  );
}

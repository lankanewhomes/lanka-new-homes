import type { Metadata } from "next";
import Link from "next/link";
import { POPULAR_POSTAL_TOWNS, formatCodes, getPostalTown, postalDistrictPath, postalDistricts, postalTownPath, postalTowns, type PostalTown } from "@/lib/postal-codes";
import { buildBreadcrumbJsonLd, jsonLdScriptProps, withSocial } from "@/lib/seo";

// Hub for the postal code pages (2026-11-24). Static data, see src/lib/postal-codes.ts.
const PATH = "/postal-codes";
const TITLE = "Sri Lanka Postal Codes: Find the Postal Code of Any Town";
const DESCRIPTION = `Postal codes (zip codes) for ${postalTowns.length.toLocaleString("en-US")} towns in all 25 districts of Sri Lanka, including Colombo 1 to 15, Kandy, Gampaha and Galle. Pick a district to see every code.`;

export const metadata: Metadata = withSocial({ title: TITLE, description: DESCRIPTION, alternates: { canonical: PATH } }, { path: PATH });

export default function PostalCodesHubPage() {
  const popular = POPULAR_POSTAL_TOWNS.map(([district, town]) => getPostalTown(district, town)).filter((town): town is PostalTown => Boolean(town));
  const colombo = postalDistricts.find((district) => district.slug === "colombo");
  const colomboCity = (colombo?.towns ?? []).filter((town) => /^Colombo \d+$/.test(town.name));
  const breadcrumb = buildBreadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Postal codes", href: PATH }]);

  return (
    <div className="fdv-page">
      <script {...jsonLdScriptProps(breadcrumb)} />
      <section className="fdv-hero fdv-hero--split" aria-label="Sri Lanka postal codes">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Sri Lanka postal codes.</h1>
            <p className="fdv-hero-sub">
              Find the postal code (zip code) of any town in Sri Lanka. {postalTowns.length.toLocaleString("en-US")} towns in all {postalDistricts.length} districts,
              from the Sri Lanka Post town list. Pick a district, or go straight to a town below.
            </p>
            <div className="fdv-hero-ctas">
              <Link href={postalDistrictPath("colombo")} className="fdv-cta-final-button">Colombo postal codes</Link>
              <Link href="/neighborhoods" className="fdv-cta-secondary fdv-hero-explore-link">Browse areas</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" aria-label="Postal codes by district">
        <div className="wdx-section-head" data-reveal>
          <h2>Postal codes by district.</h2>
          <p>All {postalDistricts.length} districts</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {postalDistricts.map((district) => (
            <Link key={district.slug} href={postalDistrictPath(district.slug)} className="fdv-box-card fdv-box-card-link">
              <h3>{district.name} district</h3>
              <p>{district.towns.length} towns · {district.province} Province</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="fdv-box fdv-box--sage" aria-label="Most searched postal codes">
        <div className="wdx-section-head" data-reveal>
          <h2>Most searched postal codes.</h2>
          <p>The towns people look up most</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
          {popular.map((town) => (
            <Link key={postalTownPath(town)} href={postalTownPath(town)} className="fdv-box-card fdv-box-card-link">
              <h3>{town.name}</h3>
              <p>Postal code {formatCodes(town)} · {town.district} district</p>
            </Link>
          ))}
        </div>
      </section>

      {colomboCity.length > 0 ? (
        <section className="fdv-box fdv-box--cream" aria-label="Colombo 1 to 15 postal codes">
          <div className="wdx-section-head" data-reveal>
            <h2>Colombo 1 to 15 postal codes.</h2>
            <p>The postal code of each Colombo city zone</p>
          </div>
          <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
            {colomboCity.map((town) => (
              <Link key={town.slug} href={postalTownPath(town)} className="fdv-box-card fdv-box-card-link">
                <h3>{town.name}</h3>
                <p>Postal code {formatCodes(town)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="fdv-box fdv-box--lilac" aria-label="About Sri Lanka postal codes">
        <div className="wdx-section-head" data-reveal>
          <h2>How postal codes work in Sri Lanka.</h2>
        </div>
        <p data-reveal>
          A Sri Lankan postal code has five digits and belongs to the post office that delivers to a town. The first digit shows the
          region: codes starting with 0 are Colombo city (Colombo 1 is 00100, Colombo 15 is 01500), 1 is the rest of the Western
          Province, 2 is the Central Province, and so on around the island. Write the code on its own line under the town name when you
          address a letter, a parcel or an online order. People also call it a zip code or a postcode: in Sri Lanka they all mean the
          same five-digit number.
        </p>
        <p data-reveal>
          LankaNewHomes lists new homes and land for sale across Sri Lanka, so each town page also links to the homes and land plots
          for sale there. Start with <Link href="/projects">new homes for sale</Link>, <Link href="/land">land for sale</Link> or the{" "}
          <Link href="/neighborhoods">area guides</Link>.
        </p>
      </section>
    </div>
  );
}

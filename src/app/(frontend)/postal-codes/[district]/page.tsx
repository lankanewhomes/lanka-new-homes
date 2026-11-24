import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCodes, getPostalDistrict, postalDistrictPath, postalDistricts, postalTownPath } from "@/lib/postal-codes";
import { buildBreadcrumbJsonLd, jsonLdScriptProps, withSocial } from "@/lib/seo";

// Every town's postal code in one district (2026-11-24). Static data, see src/lib/postal-codes.ts.
type Props = { params: Promise<{ district: string }> };

export function generateStaticParams() {
  return postalDistricts.map((district) => ({ district: district.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district: slug } = await params;
  const district = getPostalDistrict(slug);
  if (!district) return { title: "Postal Codes Not Found", robots: { index: false, follow: false } };
  const path = postalDistrictPath(district.slug);
  const main = district.towns.find((town) => town.slug === district.slug);
  return withSocial({
    title: `${district.name} Postal Codes: All ${district.towns.length} Towns in ${district.name} District`,
    description: `Postal codes (zip codes) of all ${district.towns.length} towns in ${district.name} district, ${district.province} Province, Sri Lanka${main ? `. The postal code of ${main.name} town is ${formatCodes(main)}` : ""}. Listed A to Z.`,
    alternates: { canonical: path },
  }, { path });
}

export default async function PostalDistrictPage({ params }: Props) {
  const { district: slug } = await params;
  const district = getPostalDistrict(slug);
  if (!district) return notFound();

  const main = district.towns.find((town) => town.slug === district.slug);
  const codes = district.towns.flatMap((town) => town.codes).sort();
  const others = postalDistricts.filter((other) => other.province === district.province && other.slug !== district.slug);
  const breadcrumb = buildBreadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Postal codes", href: "/postal-codes" }, { label: `${district.name} district`, href: postalDistrictPath(district.slug) }]);

  return (
    <div className="fdv-page">
      <script {...jsonLdScriptProps(breadcrumb)} />
      <section className="fdv-hero fdv-hero--split" aria-label={`${district.name} district postal codes`}>
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">{district.name} district postal codes.</h1>
            <p className="fdv-hero-sub">
              Postal codes (zip codes) of all {district.towns.length} towns in {district.name} district, {district.province} Province, Sri Lanka.
              {main ? ` The postal code of ${main.name} town is ${formatCodes(main)}.` : ""} Codes in this district run from {codes[0]} to {codes[codes.length - 1]}.
            </p>
            <div className="fdv-hero-ctas">
              <Link href="/postal-codes" className="fdv-cta-final-button">All districts</Link>
              <Link href="/neighborhoods" className="fdv-cta-secondary fdv-hero-explore-link">Browse areas</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" aria-label={`Towns in ${district.name} district`}>
        <div className="wdx-section-head" data-reveal>
          <h2>Towns in {district.name} district, A to Z.</h2>
          <p>{district.towns.length} towns</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--3">
          {district.towns.map((town) => (
            <Link key={town.slug} href={postalTownPath(town)} className="fdv-box-card fdv-box-card-link">
              <h3>{town.name}</h3>
              <p>Postal code {formatCodes(town)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" aria-label={`About ${district.name} postal codes`}>
        <div className="wdx-section-head" data-reveal>
          <h2>About postal codes in {district.name} district.</h2>
        </div>
        <p data-reveal>
          {district.name} district{district.nameSi ? ` (${district.nameSi}${district.nameTa ? `, ${district.nameTa}` : ""})` : ""} is in the {district.province} Province of Sri Lanka.
          Each town above has its own five-digit postal code, set by the post office that delivers there. Open a town to see its code,
          the towns around it and the homes and land for sale nearby.
        </p>
        {others.length > 0 ? (
          <p data-reveal>
            Other districts in the {district.province} Province:{" "}
            {others.map((other, index) => (
              <span key={other.slug}>
                {index > 0 ? ", " : ""}
                <Link href={postalDistrictPath(other.slug)}>{other.name} postal codes</Link>
              </span>
            ))}
            . Or see <Link href="/postal-codes">all Sri Lanka postal codes</Link>.
          </p>
        ) : null}
      </section>
    </div>
  );
}

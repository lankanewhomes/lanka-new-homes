import Link from "next/link";
import { buildBreadcrumbJsonLd, buildItemListJsonLd, jsonLdScriptProps } from "@/lib/seo";
import { SeoAboutBlock } from "@/components/marketplace/seo-about-block";
import { PartnerDirectoryCard } from "@/components/marketplace/partner-directory-card";
import type { ConstructionCompanyPageConfig } from "@/lib/construction-company-categories";
import type { ConstructionCompany } from "@/types";

const PAGE_LABELS: Record<string, string> = {
  "/construction-companies": "All Construction Companies",
  "/construction-companies/colombo": "Colombo",
  "/construction-companies/swimming-pools": "Swimming Pools",
  "/construction-companies/consulting": "Consulting",
  "/projects/colombo": "New Projects in Colombo",
  "/projects/beachfront": "Beachfront Developments",
  "/projects/villas": "Villa Developments",
  "/guides/investment-property": "Investment Property Guide",
};

export function ConstructionCompanyShell({ config, companies }: { config: ConstructionCompanyPageConfig; companies: ConstructionCompany[] }) {
  const itemListJsonLd = buildItemListJsonLd(companies.map((company) => ({ name: company.name, url: `/construction-companies/${company.slug}` })));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(config.breadcrumbs);

  return (
    <div>
      <script {...jsonLdScriptProps(itemListJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />

      <div className="listing-page-intro">
        <h1>{config.h1}</h1>
        <p>{config.intro}</p>
      </div>

      <p className="partner-directory-count">{companies.length} compan{companies.length === 1 ? "y" : "ies"}</p>

      <div className="partner-directory-grid">
        {companies.map((company) => (
          <PartnerDirectoryCard
            key={company.slug}
            slug={company.slug}
            basePath="/construction-companies"
            name={company.name}
            logo={company.logo}
            location={company.location}
            description={company.description}
            yearsInBusiness={company.yearsInBusiness}
            phone={company.phone}
          />
        ))}
      </div>

      <SeoAboutBlock
        title="Choosing a construction company"
        paragraphs={[
          `${config.intro} Each company below has its own profile with its location, years in business and contact details, so you can shortlist a few and speak to them directly.`,
          "When you compare builders, ask to see completed projects similar to yours, confirm who will supervise the site, and request a written quotation that lists what is and is not included. For a home build it also helps to ask how variations are priced and how payments are tied to progress.",
          "These companies are separate from the property developers on LankaNewHomes, who sell finished or planned homes. Use this directory if you own land and want to build, renovate or add a specialist feature, and use the Developers directory if you want to buy a new home.",
        ]}
      />

      {config.relatedPaths.length > 0 ? (
        <nav className="listing-related-links" aria-label="Related pages">
          <p>Explore related pages:</p>
          <ul>
            {config.relatedPaths.map((path) => (
              <li key={path}>
                <Link href={path}>{PAGE_LABELS[path] ?? path}</Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

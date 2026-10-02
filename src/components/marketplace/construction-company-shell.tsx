import { buildBreadcrumbJsonLd, buildItemListJsonLd, jsonLdScriptProps } from "@/lib/seo";
import { PartnerDirectoryPage } from "@/components/marketplace/partner-directory-page";
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
    <PartnerDirectoryPage
      title={config.h1}
      intro={config.intro}
      noun="company"
      nounPlural="companies"
      basePath="/construction-companies"
      entries={companies}
      about={{
        title: "Choosing a construction company.",
        paragraphs: [
          `${config.intro} Each company has its own profile with its location, years in business and contact details, so you can shortlist a few and speak to them directly.`,
          "When you compare builders, ask to see completed projects similar to yours, confirm who will supervise the site, and request a written quotation that lists what is and is not included. For a home build it also helps to ask how variations are priced and how payments are tied to progress.",
          "These companies are separate from the property developers on LankaNewHomes, who sell finished or planned homes. Use this directory if you own land and want to build, renovate or add a specialist feature, and use the Developers directory if you want to buy a new home.",
        ],
      }}
      related={config.relatedPaths.map((path) => ({ label: PAGE_LABELS[path] ?? path, href: path }))}
    >
      <script {...jsonLdScriptProps(itemListJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
    </PartnerDirectoryPage>
  );
}

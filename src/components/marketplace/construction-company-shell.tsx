import Image from "next/image";
import Link from "next/link";
import { buildBreadcrumbJsonLd, buildItemListJsonLd, jsonLdScriptProps } from "@/lib/seo";
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
    <div className="space-y-4">
      <script {...jsonLdScriptProps(itemListJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />

      <div className="listing-page-intro">
        <h1>{config.h1}</h1>
        <p>{config.intro}</p>
      </div>

      <p className="text-sm font-medium text-stone-700">{companies.length} compan{companies.length === 1 ? "y" : "ies"}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <Link
            key={company.slug}
            href={`/construction-companies/${company.slug}`}
            id={company.slug}
            className="grid grid-cols-[80px_1fr] gap-3 border border-stone-200 bg-white p-4 transition-colors hover:border-stone-400"
          >
            {company.logo ? (
              <Image src={company.logo} alt={`${company.name} logo, construction company in ${company.location}`} width={80} height={80} className="h-20 w-20 rounded-sm object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-sm bg-stone-100" aria-hidden="true" />
            )}
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-stone-900">{company.name}</h2>
              <p className="text-sm text-stone-600">{company.location}</p>
              <p className="text-sm text-stone-700">{company.description}</p>
              <div className="flex flex-wrap gap-3 pt-1 text-xs text-stone-500">
                {company.yearsInBusiness ? <span>{company.yearsInBusiness} years in business</span> : null}
                {company.phone ? <span>{company.phone}</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>

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

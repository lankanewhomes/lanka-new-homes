import Link from "next/link";
import { ListingPageBody } from "@/components/marketplace/listing-page";
import { buildBreadcrumbJsonLd, buildItemListJsonLd, jsonLdScriptProps, type BreadcrumbEntry } from "@/lib/seo";
import type { Project } from "@/types";

const PAGE_LABELS: Record<string, string> = {
  "/projects": "All New Projects",
  "/projects/pre-construction": "Pre-Construction",
  "/projects/colombo": "Colombo",
  "/projects/colombo/luxury": "Colombo Luxury",
  "/projects/branded-residences": "Branded Residences",
  "/projects/villas": "Villas",
  "/projects/beachfront": "Beachfront",
  "/projects/serviced-apartments": "Serviced Apartments",
  "/projects/port-city-colombo": "Port City Colombo",
  "/guides/foreigners-buying-property": "Foreign Buyer Guide",
  "/guides/investment-property": "Investment Property Guide",
  "/guides/golden-visa": "Golden Visa Guide",
};

export function ProjectListingShell({
  breadcrumbs,
  h1,
  intro,
  projects,
  relatedPaths,
}: {
  breadcrumbs: BreadcrumbEntry[];
  h1: string;
  intro: string;
  projects: Project[];
  relatedPaths: string[];
}) {
  const itemListJsonLd = buildItemListJsonLd(projects.map((project) => ({ name: project.name, url: `/projects/${project.slug}` })));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbs);

  return (
    <div className="listing-page-shell space-y-4">
      <script {...jsonLdScriptProps(itemListJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />

      <ListingPageBody projects={projects} h1={h1} eyebrow="communities" intro={intro} />

      {relatedPaths.length > 0 ? (
        <nav className="listing-related-links" aria-label="Related pages">
          <p>Explore related listings:</p>
          <ul>
            {relatedPaths.map((path) => (
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

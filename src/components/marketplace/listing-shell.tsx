import { ListingPageBody } from "@/components/marketplace/listing-page";
import { buildBreadcrumbJsonLd, buildItemListJsonLd, jsonLdScriptProps, type BreadcrumbEntry } from "@/lib/seo";
import { SeoAboutBlock } from "@/components/marketplace/seo-about-block";
import { slimForHome } from "@/lib/home-slim";
import type { Project } from "@/types";

export function ProjectListingShell({
  breadcrumbs,
  h1,
  intro,
  projects,
  basePath = "/projects",
  eyebrow = "communities",
  singularEyebrow = "community",
  filterGroups,
  emptyStateText,
  citySectionHeading,
  about,
}: {
  breadcrumbs: BreadcrumbEntry[];
  h1: string;
  intro: string;
  projects: Project[];
  relatedPaths: string[];
  basePath?: string;
  eyebrow?: string;
  singularEyebrow?: string;
  filterGroups?: { label: string; options: string[] }[];
  emptyStateText?: string;
  citySectionHeading?: string;
  about?: { title: string; paragraphs: string[] };
}) {
  const itemListJsonLd = buildItemListJsonLd(projects.map((project) => ({ name: project.name, url: `${basePath}/${project.slug}` })));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbs);

  return (
    <div className="listing-page-shell space-y-4">
      <script {...jsonLdScriptProps(itemListJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />

      <ListingPageBody projects={projects.map(slimForHome)} h1={h1} eyebrow={eyebrow} singularEyebrow={singularEyebrow} intro={intro} basePath={basePath} filterGroups={filterGroups} emptyStateText={emptyStateText} citySectionHeading={citySectionHeading} />
      {about ? <SeoAboutBlock title={about.title} paragraphs={about.paragraphs} /> : null}
    </div>
  );
}

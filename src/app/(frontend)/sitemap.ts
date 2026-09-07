import type { MetadataRoute } from "next";
import { getAllProjects } from "@/lib/project-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllLands } from "@/lib/land-store";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";
import { getAllArchitects } from "@/lib/architect-store";
import { getAllInteriorDesigners } from "@/lib/interior-designer-store";
import { getAllMarketingCompanies } from "@/lib/marketing-company-store";
import { getAllSalesCompanies } from "@/lib/sales-company-store";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import { toAbsoluteUrl } from "@/lib/seo";
import { allProjectCategories } from "@/lib/listing-categories";
import { guides } from "@/lib/guides";
import { constructionCompanyPages } from "@/lib/construction-company-categories";
import type { CompanyProfile } from "@/types";

// Shared by every partner-directory family (architects, interior designers,
// marketing/sales companies, construction companies) — same list-page +
// profile-page shape (see docs/design.md's "Partner directories" convention).
// includeBasePath is false for construction companies: its base
// "/construction-companies" URL is already in constructionCompanyRoutes
// below (constructionCompanyPages has its own config entry for it), so
// adding it again here would duplicate that sitemap entry.
function companyProfileRoutes(basePath: string, companies: CompanyProfile[], now: Date, includeBasePath = true): MetadataRoute.Sitemap {
  return [
    ...(includeBasePath ? [{ url: toAbsoluteUrl(basePath), lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 }] : []),
    ...companies.map((company) => ({
      url: toAbsoluteUrl(`${basePath}/${company.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [developers, projects, lands, neighborhoods, architects, interiorDesigners, marketingCompanies, salesCompanies, constructionCompanies] = await Promise.all([
    getAllDevelopers(),
    getAllProjects(),
    getAllLands(),
    getAllNeighborhoods(),
    getAllArchitects(),
    getAllInteriorDesigners(),
    getAllMarketingCompanies(),
    getAllSalesCompanies(),
    getAllConstructionCompanies(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: toAbsoluteUrl("/projects"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/developers"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/search"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/guides"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: toAbsoluteUrl("/land"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: toAbsoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: toAbsoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const neighborhoodRoutes: MetadataRoute.Sitemap = neighborhoods.map((neighborhood) => ({
    url: toAbsoluteUrl(`/neighborhoods/${neighborhood.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
    images: [neighborhood.heroImage],
  }));

  // Architects, interior designers, marketing/sales companies, and
  // construction companies all share the same list-page + profile-page
  // shape (docs/design.md's "Partner directories" convention) — the
  // sub-category pages below (/construction-companies/colombo etc.) were
  // already in the sitemap, but the base directories and every individual
  // profile page were missing entirely.
  const partnerDirectoryRoutes: MetadataRoute.Sitemap = [
    ...companyProfileRoutes("/architects", architects, now),
    ...companyProfileRoutes("/interior-designers", interiorDesigners, now),
    ...companyProfileRoutes("/marketing-companies", marketingCompanies, now),
    ...companyProfileRoutes("/sales-companies", salesCompanies, now),
    ...companyProfileRoutes("/construction-companies", constructionCompanies, now, false),
  ];

  const projectCategoryRoutes: MetadataRoute.Sitemap = allProjectCategories.map((category) => ({
    url: toAbsoluteUrl(category.path),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const guideRoutes: MetadataRoute.Sitemap = Object.values(guides).map((guide) => ({
    url: toAbsoluteUrl(guide.path),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const constructionCompanyRoutes: MetadataRoute.Sitemap = Object.values(constructionCompanyPages).map((config) => ({
    url: toAbsoluteUrl(config.path),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: toAbsoluteUrl(`/projects/${project.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: project.status === "Now Selling" ? 0.8 : 0.7,
    images: [project.heroImage],
  }));

  const developerRoutes: MetadataRoute.Sitemap = developers.map((developer) => ({
    url: toAbsoluteUrl(`/developers/${developer.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
    images: [developer.logo],
  }));

  const landRoutes: MetadataRoute.Sitemap = lands.map((land) => ({
    url: toAbsoluteUrl(`/land/${land.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: land.status === "Available" ? 0.7 : 0.5,
    images: [land.heroImage],
  }));

  return [...staticRoutes, ...projectCategoryRoutes, ...guideRoutes, ...constructionCompanyRoutes, ...projectRoutes, ...developerRoutes, ...landRoutes, ...neighborhoodRoutes, ...partnerDirectoryRoutes];
}

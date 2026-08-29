import type { MetadataRoute } from "next";
import { getAllProjects } from "@/lib/project-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllLands } from "@/lib/land-store";
import { toAbsoluteUrl } from "@/lib/seo";
import { allProjectCategories } from "@/lib/listing-categories";
import { guides } from "@/lib/guides";
import { constructionCompanyPages } from "@/lib/construction-company-categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [developers, projects, lands] = await Promise.all([getAllDevelopers(), getAllProjects(), getAllLands()]);

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

  return [...staticRoutes, ...projectCategoryRoutes, ...guideRoutes, ...constructionCompanyRoutes, ...projectRoutes, ...developerRoutes, ...landRoutes];
}

import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { getAllDevelopers } from "@/lib/developer-store";
import { toAbsoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const developers = await getAllDevelopers();

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
  ];

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

  return [...staticRoutes, ...projectRoutes, ...developerRoutes];
}

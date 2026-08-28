import type { Metadata } from "next";
import type { ConstructionCompanyCategory } from "@/types";
import type { BreadcrumbEntry } from "@/lib/seo";

export type ConstructionCompanyPageConfig = {
  path: string;
  category: ConstructionCompanyCategory;
  breadcrumbs: BreadcrumbEntry[];
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  relatedPaths: string[];
};

export const constructionCompanyPages: Record<string, ConstructionCompanyPageConfig> = {
  all: {
    path: "/construction-companies",
    category: "general",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Construction Companies" }],
    metaTitle: "Construction Companies in Sri Lanka | Directory",
    metaDescription: "Browse construction companies in Sri Lanka for new home builds, from general contractors to specialist pool and consulting firms.",
    h1: "Construction Companies in Sri Lanka",
    intro: "Find a construction company in Sri Lanka for your next home build. This directory lists general contractors, specialist builders, and consultants working on residential projects island-wide — separate from the project developers listed under Developers.",
    relatedPaths: ["/construction-companies/colombo", "/construction-companies/swimming-pools", "/construction-companies/consulting"],
  },
  colombo: {
    path: "/construction-companies/colombo",
    category: "colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Construction Companies", href: "/construction-companies" }, { label: "Colombo" }],
    metaTitle: "Construction Companies in Colombo",
    metaDescription: "Find construction companies in Colombo for new home builds and renovations, with contact details and years in business.",
    h1: "Construction Companies in Colombo",
    intro: "Building in the capital? These construction companies in Colombo handle everything from custom homes to small residential developments across the Western Province.",
    relatedPaths: ["/construction-companies", "/projects/colombo"],
  },
  "swimming-pools": {
    path: "/construction-companies/swimming-pools",
    category: "swimming-pools",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Construction Companies", href: "/construction-companies" }, { label: "Swimming Pools" }],
    metaTitle: "Swimming Pool Construction Companies in Sri Lanka",
    metaDescription: "Directory of swimming pool construction companies in Sri Lanka for residential and resort pools, from design through waterproofing and finishing.",
    h1: "Swimming Pool Construction Companies in Sri Lanka",
    intro: "These swimming pool construction companies in Sri Lanka design and build residential and resort pools, handling everything from excavation and waterproofing to tiling and finishing.",
    relatedPaths: ["/construction-companies", "/projects/beachfront", "/projects/villas"],
  },
  consulting: {
    path: "/construction-companies/consulting",
    category: "consulting",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Construction Companies", href: "/construction-companies" }, { label: "Consulting" }],
    metaTitle: "Construction Consultant Companies in Sri Lanka",
    metaDescription: "Construction consultant companies in Sri Lanka offering quantity surveying, project management, and technical consulting for residential builds.",
    h1: "Construction Consultant Companies in Sri Lanka",
    intro: "These construction consultant companies in Sri Lanka provide quantity surveying, project management, and technical advisory services for residential builds and new developments.",
    relatedPaths: ["/construction-companies", "/guides/investment-property"],
  },
};

export function buildConstructionCompanyMetadata(config: ConstructionCompanyPageConfig): Metadata {
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    alternates: {
      canonical: config.path,
    },
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      url: config.path,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.metaTitle,
      description: config.metaDescription,
    },
  };
}

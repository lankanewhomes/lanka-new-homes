import type { Metadata } from "next";
import type { Project } from "@/types";
import type { BreadcrumbEntry } from "@/lib/seo";

export type ProjectCategory = {
  path: string;
  breadcrumbLabel: string;
  breadcrumbs: BreadcrumbEntry[];
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  relatedPaths: string[];
  filter: (project: Project) => boolean;
};

const BEACH_LOCATIONS = ["galle", "hikkaduwa", "negombo", "trincomalee", "bentota", "mirissa", "weligama", "tangalle", "unawatuna", "arugam bay", "mount lavinia"];

function textIncludes(project: Project, needle: string) {
  const haystack = `${project.name} ${project.description} ${project.summary} ${project.location}`.toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

function isInColombo(project: Project) {
  return project.district.toLowerCase() === "colombo" || project.city.toLowerCase().includes("colombo") || project.location.toLowerCase().includes("colombo");
}

export const projectCategories: Record<string, ProjectCategory> = {
  "pre-construction": {
    path: "/projects/pre-construction",
    breadcrumbLabel: "Pre-Construction",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Pre-Construction" }],
    metaTitle: "Pre-Construction Condos & Off-Plan Property in Sri Lanka",
    metaDescription: "Browse upcoming and pre-construction condo projects in Sri Lanka. Reserve off-plan property early, with pricing, floor plans, and developer details.",
    h1: "Upcoming & Pre-Construction Condo Projects in Sri Lanka",
    intro: "Get ahead of the market with upcoming condo projects and off-plan property in Sri Lanka. These pre-construction condos let you lock in early pricing and choose your unit before launch, with new project announcements added as developers release plans.",
    relatedPaths: ["/projects", "/projects/colombo", "/guides/investment-property"],
    filter: (project) => project.status === "Coming Soon" || project.status === "Launching Soon",
  },
  colombo: {
    path: "/projects/colombo",
    breadcrumbLabel: "Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Colombo" }],
    metaTitle: "New Apartment Projects in Colombo | Ongoing Developments",
    metaDescription: "Explore new and ongoing apartment projects in Colombo. Compare pricing, developers, and locations across Colombo's newest real estate developments.",
    h1: "New Apartment Projects in Colombo",
    intro: "Colombo is home to Sri Lanka's most active new-development real estate market. Browse ongoing apartment projects in Colombo, from city-centre condominiums to family-sized new builds, all with real pricing and availability.",
    relatedPaths: ["/projects/colombo/luxury", "/projects/pre-construction", "/projects/port-city-colombo"],
    filter: isInColombo,
  },
  "colombo-luxury": {
    path: "/projects/colombo/luxury",
    breadcrumbLabel: "Luxury",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Colombo", href: "/projects/colombo" }, { label: "Luxury" }],
    metaTitle: "New Luxury Apartments & Condominiums in Colombo",
    metaDescription: "Discover new luxury apartments for sale in Colombo. Premium condominiums with high-end finishes, amenities, and prime addresses across the city.",
    h1: "New Luxury Apartments in Colombo",
    intro: "For buyers seeking premium new condominiums in Colombo, this collection features luxury apartments for sale with high-end finishes, full amenity packages, and addresses in the city's most sought-after neighbourhoods.",
    relatedPaths: ["/projects/colombo", "/projects/branded-residences", "/projects/port-city-colombo"],
    filter: (project) => isInColombo(project) && (project.type === "Condominium" || project.type === "Apartments" || project.startingPriceLkr >= 40_000_000),
  },
  "branded-residences": {
    path: "/projects/branded-residences",
    breadcrumbLabel: "Branded Residences",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Branded Residences" }],
    metaTitle: "Branded Residences in Sri Lanka | New Developments",
    metaDescription: "See branded residences in Sri Lanka developed with international hospitality and lifestyle brands, offering managed amenities and premium finishes.",
    h1: "Branded Residences in Sri Lanka",
    intro: "Branded residences pair private ownership with the amenities, service standards, and design of an established hospitality or lifestyle brand. Explore branded residence projects currently available in Sri Lanka.",
    relatedPaths: ["/projects/colombo/luxury", "/projects/beachfront", "/projects/port-city-colombo"],
    filter: (project) => textIncludes(project, "branded residence") || textIncludes(project, "branded residences"),
  },
  villas: {
    path: "/projects/villas",
    breadcrumbLabel: "Villas",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Villas" }],
    metaTitle: "New Villa Developments in Sri Lanka | New Build Homes",
    metaDescription: "Browse new villa developments in Sri Lanka. Compare new build homes with private gardens, pools, and modern layouts across the island.",
    h1: "New Villa Developments in Sri Lanka",
    intro: "Looking for a new build home rather than an apartment? These new villa developments in Sri Lanka offer private gardens, standalone layouts, and often pool access, from coastal towns to Colombo's suburbs.",
    relatedPaths: ["/projects/beachfront", "/projects", "/guides/investment-property"],
    filter: (project) => project.type === "Villas",
  },
  beachfront: {
    path: "/projects/beachfront",
    breadcrumbLabel: "Beachfront",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Beachfront" }],
    metaTitle: "Beachfront Condo Developments & Resort Residences Sri Lanka",
    metaDescription: "Explore beachfront condo developments and new resort residences in Sri Lanka, from Galle to the east coast, with ocean views and resort-style amenities.",
    h1: "Beachfront Condo Developments in Sri Lanka",
    intro: "From the south coast to the east, these beachfront condo developments and new resort residences in Sri Lanka offer ocean views, resort-style amenities, and strong rental potential for investors.",
    relatedPaths: ["/projects/villas", "/guides/investment-property", "/guides/foreigners-buying-property"],
    filter: (project) => BEACH_LOCATIONS.some((town) => project.city.toLowerCase().includes(town) || project.location.toLowerCase().includes(town)) || textIncludes(project, "beach") || textIncludes(project, "resort"),
  },
  "serviced-apartments": {
    path: "/projects/serviced-apartments",
    breadcrumbLabel: "Serviced Apartments",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Serviced Apartments" }],
    metaTitle: "New Serviced Apartments in Sri Lanka",
    metaDescription: "Find new serviced apartments in Sri Lanka with hotel-style management, housekeeping, and amenities — ideal for investors and short-stay buyers.",
    h1: "New Serviced Apartments in Sri Lanka",
    intro: "New serviced apartments in Sri Lanka combine private ownership with hotel-style management, housekeeping, and shared amenities — a popular choice for investors targeting short-stay rental income.",
    relatedPaths: ["/guides/investment-property", "/projects/colombo/luxury", "/projects/branded-residences"],
    filter: (project) => textIncludes(project, "serviced apartment"),
  },
  "port-city-colombo": {
    path: "/projects/port-city-colombo",
    breadcrumbLabel: "Port City Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Port City Colombo" }],
    metaTitle: "Port City Colombo Apartments | New Developments",
    metaDescription: "Browse Port City Colombo apartments and new developments in Sri Lanka's flagship waterfront district, with pricing and availability.",
    h1: "Port City Colombo Apartments",
    intro: "Port City Colombo is Sri Lanka's flagship waterfront development district. Browse Port City Colombo apartments and new project launches as they become available.",
    relatedPaths: ["/projects/colombo/luxury", "/projects/branded-residences", "/guides/golden-visa"],
    filter: (project) => textIncludes(project, "port city"),
  },
};

export const allProjectCategories = Object.values(projectCategories);

export function buildCategoryMetadata(category: ProjectCategory): Metadata {
  return {
    title: category.metaTitle,
    description: category.metaDescription,
    alternates: {
      canonical: category.path,
    },
    openGraph: {
      title: category.metaTitle,
      description: category.metaDescription,
      url: category.path,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: category.metaTitle,
      description: category.metaDescription,
    },
  };
}

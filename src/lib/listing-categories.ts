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
  /** Optional written explainer shown under the results (adds crawlable context to a card-heavy page). */
  about?: { title: string; paragraphs: string[] };
  relatedPaths: string[];
  filter: (project: Project) => boolean;
};

const BEACH_LOCATIONS = ["galle", "hikkaduwa", "negombo", "trincomalee", "bentota", "mirissa", "weligama", "tangalle", "unawatuna", "arugam bay", "mount lavinia"];

function textIncludes(project: Project, needle: string) {
  const haystack = `${project.name} ${project.description} ${project.summary} ${project.location}`.toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

function isInColombo(project: Project) {
  return (project.district ?? "").toLowerCase() === "colombo" || (project.city ?? "").toLowerCase().includes("colombo") || (project.location ?? "").toLowerCase().includes("colombo");
}

export const projectCategories: Record<string, ProjectCategory> = {
  "pre-construction": {
    path: "/projects/pre-construction",
    breadcrumbLabel: "Pre-Construction",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Pre-Construction" }],
    metaTitle: "Pre-Construction & Off-Plan Property",
    metaDescription: "Browse upcoming and pre-construction condo projects in Sri Lanka. Reserve off-plan property early, with pricing, floor plans, and developer details.",
    h1: "Upcoming & Pre-Construction Condo Projects in Sri Lanka",
    intro: "Get ahead of the market with upcoming condo projects and off-plan property in Sri Lanka. These pre-construction condos let you lock in early pricing and choose your unit before launch, with new project announcements added as developers release plans.",
    about: { title: "Buying a home before it is built", paragraphs: [
      "A pre-construction (off-plan) home is one you reserve and pay for in stages while the building is still being planned or built. Developers usually offer earlier-stage buyers a wider choice of units and floors, and payment plans spread across the construction period.",
      "This page lists projects on LankaNewHomes that are not yet complete, including those coming soon and those under construction. Each listing shows the developer, location, expected completion where stated, floor plans and the payment plan the developer has shared.",
      "Before you commit, review the developer's track record on the listing and profile pages, ask for the project approvals and the sales agreement, and check how each payment is linked to construction progress. Enquiries sent from a listing reach the developer directly.",
    ] },
    relatedPaths: ["/projects", "/projects/colombo", "/guides/investment-property"],
    filter: (project) => project.status === "Coming Soon" || project.status === "Launching Soon",
  },
  colombo: {
    path: "/projects/colombo",
    breadcrumbLabel: "Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Colombo" }],
    metaTitle: "New Apartment Projects in Colombo",
    metaDescription: "Explore new and ongoing apartment projects in Colombo. Compare pricing, developers, and locations across Colombo's newest real estate developments.",
    h1: "New Apartment Projects in Colombo",
    intro: "Colombo is home to Sri Lanka's most active new-development real estate market. Browse ongoing apartment projects in Colombo, from city-centre condominiums to family-sized new builds, all with real pricing and availability.",
    relatedPaths: ["/projects/luxury", "/projects/pre-construction", "/projects/port-city-colombo"],
    filter: isInColombo,
  },
  luxury: {
    path: "/projects/luxury",
    breadcrumbLabel: "Luxury",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Luxury" }],
    metaTitle: "New Luxury Apartments in Sri Lanka",
    metaDescription: "Discover new luxury apartments for sale across Sri Lanka. Premium condominiums with high-end finishes, full amenity packages, and prime addresses.",
    h1: "New Luxury Apartments in Sri Lanka",
    intro: "For buyers seeking premium new condominiums anywhere in Sri Lanka, this collection features luxury apartments for sale with high-end finishes, full amenity packages, and addresses in the country's most sought-after neighbourhoods.",
    relatedPaths: ["/projects/colombo", "/projects/branded-residences", "/projects/port-city-colombo"],
    filter: (project) => project.type === "Condominium" || project.type === "Apartments" || project.startingPriceLkr >= 40_000_000,
  },
  "branded-residences": {
    path: "/projects/branded-residences",
    breadcrumbLabel: "Branded Residences",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Branded Residences" }],
    metaTitle: "Branded Residences in Sri Lanka",
    metaDescription: "See branded residences in Sri Lanka developed with international hospitality and lifestyle brands, offering managed amenities and premium finishes.",
    h1: "Branded Residences in Sri Lanka",
    intro: "Branded residences pair private ownership with the amenities, service standards, and design of an established hospitality or lifestyle brand. Explore branded residence projects currently available in Sri Lanka.",
    about: { title: "What are branded residences?", paragraphs: [
      "Branded residences are homes designed, serviced or operated in partnership with a well-known hotel, hospitality or lifestyle brand. Owners typically get the building design and standards associated with that brand, and often access to services such as a front desk, housekeeping, concierge, fitness and wellness facilities, and shared dining or leisure spaces.",
      "On LankaNewHomes this page gathers new projects in Sri Lanka that carry a brand or hospitality-led positioning. Each listing shows the developer, location, current status, floor plans and payment plan where the developer has provided them, so you can compare projects side by side.",
      "Because the brand's services and fees differ from project to project, ask the developer exactly what is included, how the service charge works and whether a rental or management programme is offered. You can send an enquiry from any listing and it goes straight to the developer.",
    ] },
    relatedPaths: ["/projects/luxury", "/projects/beachfront", "/projects/port-city-colombo"],
    filter: (project) => textIncludes(project, "branded residence") || textIncludes(project, "branded residences"),
  },
  villas: {
    path: "/projects/villas",
    breadcrumbLabel: "Villas",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Villas" }],
    metaTitle: "New Villas in Sri Lanka – Villa Developments",
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
    metaTitle: "Beachfront Condos & Resort Residences",
    metaDescription: "Explore beachfront condo developments and new resort residences in Sri Lanka, from Galle to the east coast, with ocean views and resort-style amenities.",
    h1: "Beachfront Condo Developments in Sri Lanka",
    intro: "From the south coast to the east, these beachfront condo developments and new resort residences in Sri Lanka offer ocean views, resort-style amenities, and strong rental potential for investors.",
    relatedPaths: ["/projects/villas", "/guides/investment-property", "/guides/foreigners-buying-property"],
    filter: (project) => BEACH_LOCATIONS.some((town) => (project.city ?? "").toLowerCase().includes(town) || (project.location ?? "").toLowerCase().includes(town)) || textIncludes(project, "beach") || textIncludes(project, "resort"),
  },
  "serviced-apartments": {
    path: "/projects/serviced-apartments",
    breadcrumbLabel: "Serviced Apartments",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Serviced Apartments" }],
    metaTitle: "New Serviced Apartments in Sri Lanka",
    metaDescription: "Find new serviced apartments in Sri Lanka with hotel-style management, housekeeping, and amenities — ideal for investors and short-stay buyers.",
    h1: "New Serviced Apartments in Sri Lanka",
    intro: "New serviced apartments in Sri Lanka combine private ownership with hotel-style management, housekeeping, and shared amenities — a popular choice for investors targeting short-stay rental income.",
    about: { title: "About serviced apartments", paragraphs: [
      "Serviced apartments are residences that come with hotel-style support such as reception, housekeeping, security and shared facilities. They suit owners who want a low-maintenance home in the city, and some projects also offer a managed rental option for when the owner is away.",
      "This page gathers serviced and hospitality-style apartment projects listed on LankaNewHomes. Each listing includes the developer, location, status, floor plans and payment plan where available, so you can compare what is on offer in different parts of Sri Lanka.",
      "Service levels and charges vary between projects. Ask the developer what the monthly service charge covers, who operates the building, and whether a rental programme is available, then send your enquiry directly from the listing page.",
    ] },
    relatedPaths: ["/guides/investment-property", "/projects/luxury", "/projects/branded-residences"],
    filter: (project) => textIncludes(project, "serviced apartment"),
  },
  "port-city-colombo": {
    path: "/projects/port-city-colombo",
    breadcrumbLabel: "Port City Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Port City Colombo" }],
    metaTitle: "Port City Colombo New Apartments",
    metaDescription: "Browse Port City Colombo apartments and new developments in Sri Lanka's flagship waterfront district, with pricing and availability.",
    h1: "Port City Colombo Apartments",
    intro: "Port City Colombo is Sri Lanka's flagship waterfront development district. Browse Port City Colombo apartments and new project launches as they become available.",
    about: { title: "About Port City Colombo", paragraphs: [
      "Port City Colombo is a large waterfront development built on land reclaimed from the sea beside Galle Face in Colombo. It is planned as a new city district with residential towers, offices, retail, hotels and public spaces, and it operates as a special economic zone.",
      "This page lists new residential projects in and around Port City Colombo that are listed on LankaNewHomes. Every listing shows its developer, status, floor plans and payment plan where provided, and you can enquire with the developer directly from the listing page.",
      "If you are considering a purchase here, ask the developer about the tenure and ownership terms that apply to the project, the expected completion timeline, and how payments are staged, since conditions can differ from a conventional Colombo apartment purchase.",
    ] },
    relatedPaths: ["/projects/luxury", "/projects/branded-residences", "/guides/golden-visa"],
    filter: (project) => textIncludes(project, "port city"),
  },
};

export const allProjectCategories = Object.values(projectCategories);

// Every route that renders ListingPageBody (list+map view) — used to gate
// the map sidebar's rail-width offset on the header/breadcrumb, which
// otherwise render on every page on the site, not just these. Exact match
// only: a prefix check would also match detail pages like /projects/[slug]
// or /land/[slug], which never render the rail.
export const mapSidebarRoutes: string[] = ["/projects", "/land", "/search", ...allProjectCategories.map((category) => category.path)];

export type SearchablePage = { label: string; path: string; keywords: string };

// Powers the "Pages" suggestions in the listing search bar (src/components/
// marketplace/listing-page.tsx) — typing e.g. "pre" or "luxury" jumps
// straight to the matching category page instead of only filtering the
// projects already loaded on the current page.
export const searchablePages: SearchablePage[] = [
  { label: "New Projects", path: "/projects", keywords: "new projects all projects new homes" },
  ...allProjectCategories.map((category) => ({
    label: category.h1,
    path: category.path,
    keywords: `${category.breadcrumbLabel} ${category.h1}`.toLowerCase(),
  })),
  { label: "Land for Sale in Sri Lanka", path: "/land", keywords: "land lands plot plots" },
];

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

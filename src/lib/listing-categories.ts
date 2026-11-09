import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
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
  /** Extra words that should find this page in the site search (alternate spellings, brand names). */
  extraKeywords?: string;
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

const isApartment = (project: Project) => /apartment|condominium|penthouse/i.test(project.type ?? "");
const isHouseType = (project: Project) => ["house", "villas", "luxury villas", "townhouse"].includes((project.type ?? "").toLowerCase());
const isCompleted = (project: Project) => (project.status as string) === "Completed";
const isInKandy = (project: Project) => /kandy/i.test(`${project.district ?? ""} ${project.city ?? ""} ${project.location ?? ""}`);

export const projectCategories: Record<string, ProjectCategory> = {
  "keells-homes-for-sale": {
    path: "/projects/keells-homes-for-sale",
    breadcrumbLabel: "Keells Homes",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Keells Homes" }],
    metaTitle: "Keells Homes for Sale in Sri Lanka",
    metaDescription: "Browse John Keells Properties homes for sale in Sri Lanka: Vauxhall DSTRCT, VIMAN Ja-Ela, Cinnamon Life and TRI-ZEN apartments, with prices, floor plans and photos.",
    h1: "Keells Homes for Sale in Sri Lanka",
    intro: "Looking for Keells homes for sale? These are the apartments developed by John Keells Properties, the real estate arm of the John Keells Group, from landmark Colombo 02 towers to the VIMAN community in Ja-Ela, each with current prices, floor plans and photos.",
    about: { title: "About Keells homes and John Keells Properties", paragraphs: [
      "John Keells Properties is the real estate arm of the John Keells Group, Sri Lanka's largest conglomerate. Established in 2003, it develops luxury city apartments and suburban communities across Sri Lanka. Its landmark projects include The Monarch, The Emperor, OnThree20, Cinnamon Life, TRI-ZEN and VIMAN. People search for it as Keells, Keels or John Keells homes; this page gathers all of its homes for sale in Sri Lanka that are listed on LankaNewHomes.",
      "The collection currently covers Vauxhall DSTRCT on Vauxhall Street in Colombo 02, VIMAN Ja-Ela Apartments close to the Colombo–Katunayake Expressway, The Residences at Cinnamon Life in Colombo 02 and TRI-ZEN Apartments at Union Place, Colombo 02. Each listing shows the developer's own details: location, status, floor plans, sizes and the payment plan where one has been published.",
      "To compare Keells apartments, open each project to see its floor plans and amenities, then use the enquiry form on the listing: it goes straight to the developer. For the company profile and everything John Keells Properties has listed, see the developer page linked below.",
    ] },
    relatedPaths: ["/developers/john-keells-properties", "/projects/colombo", "/projects/luxury"],
    extraKeywords: "keells keels john keells john keels jkp keells properties keells apartments",
    filter: (project) => (project.developerName ?? "").toLowerCase().includes("john keells"),
  },
  "prime-lands-apartments": {
    path: "/projects/prime-lands-apartments",
    breadcrumbLabel: "Prime Lands Apartments",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Prime Lands Apartments" }],
    metaTitle: "Prime Lands Apartments for Sale in Sri Lanka",
    metaDescription: "Browse Prime Lands apartments and new homes for sale in Sri Lanka: current projects from Prime Lands with prices, floor plans, photos and locations.",
    h1: "Prime Lands Apartments for Sale in Sri Lanka",
    intro: "Looking for Prime Lands apartments? These are the apartment and housing projects developed by Prime Lands, one of Sri Lanka's best-known property developers, each with current prices, floor plans and photos. More Prime Lands apartments are being added as they are confirmed.",
    about: { title: "About Prime Lands apartments", paragraphs: [
      "Prime Lands (Prime Lands (Pvt) Ltd) is a Sri Lankan property developer known for its land plots, residential communities and, more recently, apartment projects in and around Colombo and in towns such as Negombo and Kadawatha. People search for it as Prime Lands apartments, Prime Residencies or Prime Lands homes.",
      "This page gathers every Prime Lands project listed on LankaNewHomes. Open a project to see its floor plans, sizes, amenities and payment plan where the developer has published one, and to check which units are still available.",
      "Use the enquiry form on any listing to ask Prime Lands about prices, a site visit or availability: it goes straight to the developer. For the company profile and its land plots, see the Prime Lands developer page and the land listings.",
    ] },
    relatedPaths: ["/developers/prime-lands", "/land", "/projects/colombo"],
    extraKeywords: "prime lands apartments prime lands apartment prime lands homes prime residencies prime lands condominium prime lands colombo",
    filter: (project) => (project.developerName ?? "").toLowerCase().includes("prime lands"),
  },
  "apartments-for-sale-in-athurugiriya": {
    path: "/projects/apartments-for-sale-in-athurugiriya",
    breadcrumbLabel: "Athurugiriya Apartments",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Apartments in Athurugiriya" }],
    metaTitle: "Apartments for Sale in Athurugiriya",
    metaDescription: "Browse new apartments for sale in Athurugiriya, Sri Lanka: current projects with prices, floor plans, photos and developer details.",
    h1: "Apartments for Sale in Athurugiriya",
    intro: "Looking for apartments for sale in Athurugiriya? These are the new apartment projects in Athurugiriya, a growing suburb southeast of Colombo, each with current prices, floor plans and photos.",
    about: { title: "About apartments in Athurugiriya", paragraphs: [
      "Athurugiriya is a suburb in the Colombo district, about 15 km southeast of the city centre, close to Malabe, Kottawa and Battaramulla. It is reached by the Athurugiriya interchange on the Outer Circular Highway and the Southern Expressway link, which makes it a practical base for commuting into Colombo.",
      "This page gathers the apartment projects in Athurugiriya that are listed on LankaNewHomes. Open a project to see its floor plans, sizes, amenities and status, and to check which units are still available.",
      "Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them. For more about the area, see the Athurugiriya neighbourhood guide linked below.",
    ] },
    relatedPaths: ["/neighborhoods/athurugiriya", "/projects/colombo", "/projects/villas"],
    extraKeywords: "apartments for sale in athurugiriya athurugiriya apartments athurugiriya condominium athurugiriya flats apartment athurugiriya",
    filter: (project) => /apartment|condominium/i.test(project.type ?? "") && `${project.city ?? ""} ${project.location ?? ""}`.toLowerCase().includes("athurugiriya"),
  },
  "gated-community-houses-for-sale": {
    path: "/projects/gated-community-houses-for-sale",
    breadcrumbLabel: "Gated Community Houses",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Gated Community Houses" }],
    metaTitle: "Gated Community Houses for Sale in Sri Lanka",
    metaDescription: "Gated community houses for sale in Sri Lanka: new houses, villas and townhouses in secure communities, with prices, floor plans and photos.",
    h1: "Gated Community Houses for Sale in Sri Lanka",
    intro: "Looking for a gated community house in Sri Lanka? These are new houses, villas and townhouses in gated and secure communities, with controlled entry, shared amenities and prices, floor plans and photos for each.",
    about: { title: "Buying a house in a gated community in Sri Lanka", paragraphs: [
      "A gated community is a residential development with controlled entry, usually with security staff, internal roads and shared facilities such as a clubhouse, pool, play area or green space. In Sri Lanka many new house and villa developments are sold this way, so buyers get a private, managed neighbourhood instead of a single standalone plot.",
      "This page gathers the new houses, villas and townhouses on LankaNewHomes whose developer describes them as gated communities. Each listing shows the developer, location, status, floor plans and sizes, and the payment plan where one has been published.",
      "Before you reserve, ask what the monthly maintenance charge covers, who manages the community after handover, and which facilities are built and which are still planned. Enquiries sent from a listing go straight to the developer.",
    ] },
    relatedPaths: ["/projects/brand-new-houses-for-sale", "/projects/villas", "/land"],
    extraKeywords: "gated community house gated community houses for sale gated community sri lanka gated community homes gated house sri lanka secure community house",
    filter: (project) => ["house", "villas", "luxury villas", "townhouse"].includes((project.type ?? "").toLowerCase()) && textIncludes(project, "gated"),
  },
  "brand-new-houses-for-sale": {
    path: "/projects/brand-new-houses-for-sale",
    breadcrumbLabel: "Brand New Houses",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Brand New Houses" }],
    metaTitle: "New Houses for Sale in Sri Lanka: Brand New Homes & Villas",
    metaDescription: "New houses for sale in Sri Lanka, brand new houses: new villas, townhouses and gated-community homes from developers, with prices, floor plans and photos.",
    h1: "Brand New Houses for Sale in Sri Lanka",
    intro: "Looking for a house in Sri Lanka for sale, or a brand new house? These are new-build houses, villas and townhouses from developers, in gated communities and standalone projects from Colombo's suburbs to the coast and the hill country, each with prices, floor plans and photos.",
    about: { title: "Buying a brand new house in Sri Lanka", paragraphs: [
      "A brand new house is a home that has just been built, or is still being built, by a developer and has never been lived in. On LankaNewHomes this page gathers the new houses, villas and townhouses that are on sale now or under construction, so you can compare them in one place instead of searching developer by developer.",
      "Every listing shows the developer, location, status, floor plans and sizes, and the payment plan where the developer has published one. Many new houses are sold in gated communities with shared amenities; others are single villas or townhouses. Open a listing to see its photos, nearby places and what the developer includes.",
      "Before you reserve, ask the developer for the title and approvals, the sales agreement, how each payment is linked to construction progress, and the handover date. You can send an enquiry from any listing and it goes straight to the developer. If you are buying from overseas, see our guide for foreign buyers.",
    ] },
    relatedPaths: ["/projects/houses-for-sale-in-colombo", "/projects/houses-for-sale-in-kandy", "/projects/villas", "/land"],
    extraKeywords: "houses for sale sri lanka new houses for sale sri lanka brand new house new house for sale new houses houses for sale new villas new homes townhouse house in sri lanka for sale house for sale in sri lanka",
    filter: (project) => ["house", "villas", "luxury villas", "townhouse"].includes((project.type ?? "").toLowerCase()) && (project.status as string) !== "Completed",
  },
  "luxury-apartments-for-sale-in-colombo": {
    path: "/projects/luxury-apartments-for-sale-in-colombo",
    breadcrumbLabel: "Luxury Apartments in Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Luxury Apartments in Colombo" }],
    metaTitle: "Luxury Apartments for Sale in Colombo",
    metaDescription: "Luxury apartments for sale in Colombo: premium new condominiums with full amenity packages, floor plans, photos and developer details.",
    h1: "Luxury Apartments for Sale in Colombo",
    intro: "Premium new apartments for sale in Colombo, from sea-view towers to high-floor residences in prime addresses, each with current prices, floor plans and photos.",
    about: { title: "About luxury apartments in Colombo", paragraphs: [
      "Luxury apartments in Colombo are new condominiums with high-end finishes, full amenity packages (pool, gym, security, concierge) and prime addresses in areas such as Colombo 2, 3, 5 and 7 and the Port City. This page gathers the Colombo projects at the top of the price range or listed as luxury.",
      "Open a project to see its floor plans, sizes, amenities and status, and to check which units are still available. Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them, with no agent in between.",
      "For luxury apartments across the rest of the country, see [luxury apartments and condos in Sri Lanka](/projects/luxury), or browse [all new apartment projects in Colombo](/projects/colombo).",
    ] },
    relatedPaths: ["/projects/colombo", "/projects/luxury", "/projects/port-city-colombo"],
    extraKeywords: "luxury apartments for sale in colombo luxury apartments colombo luxury condo colombo premium apartments colombo",
    filter: (project) => isInColombo(project) && isApartment(project) && !isCompleted(project) && (project.startingPriceLkr >= 60_000_000 || textIncludes(project, "luxury")),
  },
  "cheap-apartments-for-sale-in-colombo": {
    path: "/projects/cheap-apartments-for-sale-in-colombo",
    breadcrumbLabel: "Affordable Apartments in Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Affordable Apartments in Colombo" }],
    metaTitle: "Cheap Apartments for Sale in Colombo",
    metaDescription: "Cheap apartments for sale in Colombo: the lower-priced new apartment projects, with starting prices, floor plans and developer details.",
    h1: "Cheap Apartments for Sale in Colombo",
    intro: "The lower-priced new apartment projects in Colombo and its suburbs, with published starting prices, floor plans and photos.",
    about: { title: "About affordable apartments in Colombo", paragraphs: [
      "This page lists the new apartment projects in Colombo with a published starting price of Rs. 40 million or less, the more affordable end of the Colombo market. Prices are the developer's starting price for the smallest unit, so compare the price per square foot and what is included, not just the headline figure.",
      "Open a project to see its floor plans, sizes, amenities and status, and to check which units are still available. Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them, with no agent in between.",
      "Prefer something larger or more central? See [luxury apartments in Colombo](/projects/luxury-apartments-for-sale-in-colombo) or [all new apartment projects in Colombo](/projects/colombo).",
    ] },
    relatedPaths: ["/projects/colombo", "/projects/2-bedroom-apartments-for-sale-in-colombo", "/projects/pre-construction"],
    extraKeywords: "cheap apartments for sale in colombo affordable apartments colombo low price apartments colombo budget apartments colombo",
    filter: (project) => isInColombo(project) && isApartment(project) && !isCompleted(project) && project.startingPriceLkr > 0 && project.startingPriceLkr <= 40_000_000,
  },
  "brand-new-apartments-for-sale-in-colombo": {
    path: "/projects/brand-new-apartments-for-sale-in-colombo",
    breadcrumbLabel: "Brand New Apartments in Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Brand New Apartments in Colombo" }],
    metaTitle: "Brand New Apartments for Sale in Colombo",
    metaDescription: "Brand new apartments for sale in Colombo: new-build apartment projects on sale now or under construction, with prices, floor plans and photos.",
    h1: "Brand New Apartments for Sale in Colombo",
    intro: "New-build apartments in Colombo that are on sale now or under construction, direct from developers, with current prices, floor plans and photos.",
    about: { title: "Buying a brand new apartment in Colombo", paragraphs: [
      "A brand new apartment is a unit in a building that has just been completed or is still being built and has never been lived in. This page gathers the Colombo projects that are on sale now or under construction, and leaves out completed buildings.",
      "Open a project to see its floor plans, sizes, amenities and status, and to check which units are still available. Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them, with no agent in between.",
      "Buying off-plan? See [pre-construction projects](/projects/pre-construction) and our guide to [questions to ask before buying a home in Sri Lanka](/blog/questions-to-ask-before-buying-a-home-in-sri-lanka).",
    ] },
    relatedPaths: ["/projects/colombo", "/projects/pre-construction", "/projects/luxury-apartments-for-sale-in-colombo"],
    extraKeywords: "brand new apartments for sale in colombo new apartments colombo new build apartments colombo",
    filter: (project) => isInColombo(project) && isApartment(project) && !isCompleted(project),
  },
  "2-bedroom-apartments-for-sale-in-colombo": {
    path: "/projects/2-bedroom-apartments-for-sale-in-colombo",
    breadcrumbLabel: "2 Bedroom Apartments in Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "2 Bedroom Apartments in Colombo" }],
    metaTitle: "2 Bedroom Apartments for Sale in Colombo",
    metaDescription: "2 bedroom apartments for sale in Colombo: new projects with 2-bedroom floor plans, sizes, prices and developer details.",
    h1: "2 Bedroom Apartments for Sale in Colombo",
    intro: "New apartment projects in Colombo that offer 2-bedroom units, with floor plans, sizes and starting prices.",
    about: { title: "About 2 bedroom apartments in Colombo", paragraphs: [
      "Two-bedroom apartments are the most common choice for couples, small families and investors in Colombo. This page lists the Colombo projects that have at least one 2-bedroom floor plan; open a project to see the exact 2-bedroom sizes and layouts.",
      "Open a project to see its floor plans, sizes, amenities and status, and to check which units are still available. Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them, with no agent in between.",
      "Need more space? See [all new apartment projects in Colombo](/projects/colombo), or look at the area pages such as [apartments in Colombo 5](/projects/colombo/colombo-5).",
    ] },
    relatedPaths: ["/projects/colombo", "/projects/cheap-apartments-for-sale-in-colombo", "/projects/brand-new-apartments-for-sale-in-colombo"],
    extraKeywords: "2 bedroom apartments for sale in colombo two bedroom apartments colombo 2br apartments colombo",
    filter: (project) => isInColombo(project) && isApartment(project) && !isCompleted(project) && (project.floorPlans ?? []).some((plan) => plan.bedrooms === 2),
  },
  "houses-for-sale-in-colombo": {
    path: "/projects/houses-for-sale-in-colombo",
    breadcrumbLabel: "Houses in Colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Houses in Colombo" }],
    metaTitle: "Houses for Sale in Colombo",
    metaDescription: "Houses for sale in Colombo, Sri Lanka: new houses, villas and townhouses from developers, with prices, floor plans and photos.",
    h1: "Houses for Sale in Colombo",
    intro: "New houses, villas and townhouses for sale in Colombo and its suburbs, from developers, with prices, floor plans and photos.",
    about: { title: "About houses for sale in Colombo", paragraphs: [
      "Houses for sale in Colombo here means new-build houses, villas and townhouses from developers, in gated communities and standalone projects across Colombo and suburbs such as Thalawathugoda, Dehiwala, Kottawa and Mount Lavinia.",
      "Open a project to see its floor plans, sizes, amenities and status, and to check which units are still available. Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them, with no agent in between.",
      "Looking for land to build on? See [land for sale in Colombo](/land/best-land-for-sale-in-colombo). Prefer an apartment? See [new apartment projects in Colombo](/projects/colombo).",
    ] },
    relatedPaths: ["/projects/brand-new-houses-for-sale", "/land/best-land-for-sale-in-colombo", "/projects/colombo"],
    extraKeywords: "houses for sale in colombo houses for sale sri lanka colombo house colombo villas colombo",
    filter: (project) => isInColombo(project) && isHouseType(project),
  },
  "houses-for-sale-in-kandy": {
    path: "/projects/houses-for-sale-in-kandy",
    breadcrumbLabel: "Kandy",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Kandy" }],
    metaTitle: "Houses & Apartments for Sale in Kandy",
    metaDescription: "Houses and apartments for sale in Kandy, Sri Lanka: new projects with prices, floor plans, photos and developer details.",
    h1: "Houses & Apartments for Sale in Kandy",
    intro: "New houses, villas and apartments for sale in Kandy, from developers, with current prices, floor plans and photos.",
    about: { title: "About property for sale in Kandy", paragraphs: [
      "Kandy, in the central hills, is Sri Lanka's second most searched property market after Colombo. This page lists the new houses, villas and apartment projects in the Kandy area on LankaNewHomes.",
      "Open a project to see its floor plans, sizes, amenities and status, and to check which units are still available. Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them, with no agent in between.",
      "Looking for land in the area? See [land for sale in Kandy district](/land/district/kandy), or [all land for sale in Sri Lanka](/land).",
    ] },
    relatedPaths: ["/land/district/kandy", "/projects/villas", "/projects/brand-new-houses-for-sale"],
    extraKeywords: "houses for sale in kandy kandy houses kandy apartments for sale in kandy property kandy",
    filter: isInKandy,
  },
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
    metaTitle: "Apartments for Sale in Colombo: New Projects & Prices",
    metaDescription: "Apartments for sale in Colombo: new and ongoing projects from developers, with starting prices, floor plans, photos and locations across Colombo 1 to 15 and the suburbs.",
    h1: "New Apartment Projects in Colombo",
    intro: "Colombo is home to Sri Lanka's most active new-development real estate market. Browse ongoing apartment projects in Colombo, from city-centre condominiums to family-sized new builds, all with real pricing and availability.",
    about: { title: "About apartments for sale in Colombo", paragraphs: [
      "This page gathers the new apartment projects in Colombo on LankaNewHomes, from city-centre condominiums in Colombo 2, 3, 5 and 7 to family-sized buildings in the suburbs and the Port City. Open a project to see its floor plans, sizes, amenities, status and payment plan where the developer has published one.",
      "Browse by postcode: [Colombo 2](/projects/colombo/colombo-2), [Colombo 3](/projects/colombo/colombo-3), [Colombo 5](/projects/colombo/colombo-5), [Colombo 6](/projects/colombo/colombo-6) and [Colombo 7](/projects/colombo/colombo-7). Or by need: [luxury apartments](/projects/luxury-apartments-for-sale-in-colombo), [cheap apartments](/projects/cheap-apartments-for-sale-in-colombo), [brand new apartments](/projects/brand-new-apartments-for-sale-in-colombo) and [2 bedroom apartments](/projects/2-bedroom-apartments-for-sale-in-colombo).",
      "Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them, with no agent in between.",
    ] },
    extraKeywords: "apartments for sale in colombo colombo apartments new apartments colombo condominiums colombo flats colombo",
    relatedPaths: ["/projects/luxury", "/projects/pre-construction", "/projects/port-city-colombo"],
    filter: isInColombo,
  },
  luxury: {
    path: "/projects/luxury",
    breadcrumbLabel: "Luxury",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Luxury" }],
    metaTitle: "New Luxury Apartments & Condos in Sri Lanka",
    metaDescription: "Discover new luxury apartments and luxury condos for sale across Sri Lanka. Premium condominiums with high-end finishes, full amenity packages, and prime addresses.",
    h1: "New Luxury Apartments & Condos in Sri Lanka",
    intro: "For buyers seeking premium new condominiums anywhere in Sri Lanka, this collection features luxury apartments in Colombo, Sri Lanka and beyond, for sale with high-end finishes, full amenity packages, and addresses in the country's most sought-after neighbourhoods.",
    extraKeywords: "luxury apartments in colombo sri lanka luxury apartments colombo luxury apartments for sale sri lanka luxury condo sri lanka luxury condos for sale sri lanka luxury apartment condo luxury condominium sri lanka",
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
    metaDescription: "Browse new villa developments in Sri Lanka, including luxury beach villas for sale. Compare new build homes with private gardens, pools, and modern layouts across the island.",
    h1: "New Villa Developments in Sri Lanka",
    intro: "Looking for a new build home rather than an apartment? These new villa developments in Sri Lanka offer private gardens, standalone layouts, and often pool access, from coastal towns to Colombo's suburbs. Looking for a luxury beach villa for sale in Sri Lanka? Start with the coastal villas here, then see the beachfront collection.",
    extraKeywords: "luxury beach villa for sale in sri lanka luxury beach villa beach villa for sale sri lanka beach villas villa near beach",
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
    about: { title: "Beachfront apartments in Sri Lanka", paragraphs: [
      "Beachfront apartments in Sri Lanka are found along the south, west and east coasts. On the west coast, [Oceanista Residencies](/projects/oceanista-panadura) is a nine-storey building of beachfront apartments in Panadura, Sri Lanka, near Wadduwa, with one-, two- and three-bedroom units.",
      "Each listing on this page shows the developer, location, status and floor plans where available. You can send an enquiry from any listing and it goes straight to the developer.",
    ] },
    relatedPaths: ["/projects/villas", "/guides/investment-property", "/guides/foreigners-buying-property"],
    filter: (project) => BEACH_LOCATIONS.some((town) => (project.city ?? "").toLowerCase().includes(town) || (project.location ?? "").toLowerCase().includes(town)) || textIncludes(project, "beach") || textIncludes(project, "resort"),
  },
  lakefront: {
    path: "/projects/lakefront",
    breadcrumbLabel: "Lakefront",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Lakefront" }],
    metaTitle: "Lakefront Apartments & Homes in Sri Lanka",
    metaDescription: "Explore new lakefront apartments, residences and villas in Sri Lanka with lake views, from Nuwara Eliya and Kandy to Colombo's Beira Lake, with prices, floor plans and photos.",
    h1: "Lakefront Homes in Sri Lanka",
    intro: "New lakefront apartments, residences and villas in Sri Lanka, from hill-country lakes to Colombo's Beira Lake. Each project on this page sits beside, faces or overlooks a lake or reservoir.",
    about: { title: "Lakefront apartments and villas in Sri Lanka", paragraphs: [
      "Lakefront living in Sri Lanka ranges from hotel residences on Gregory Lake in Nuwara Eliya to apartments with Beira Lake views in Colombo. [Lakefront Residencies](/projects/lakefront-residencies) overlooks Gregory Lake in Nuwara Eliya, with studio to four-bedroom apartments and duplexes. [Mantra Kandy](/projects/mantra-kandy) offers wellness villas above the Victoria Reservoir in Digana with lake and mountain views, and [Prime Kadawatha](/projects/prime-kadawatha) is set beside a lake and paddy fields on Gonahena Road in Kadawatha.",
      "In Colombo, [Vauxhall DSTRCT](/projects/vauxhall-dstrct) lists Beira Lake and Lotus Tower among its unit views. Each listing on this page shows the developer, location, status and floor plans where available. You can send an enquiry from any listing and it goes straight to the developer.",
    ] },
    relatedPaths: ["/projects/beachfront", "/projects/luxury", "/projects/villas"],
    extraKeywords: "lake lakeside lake view lake views waterfront reservoir",
    // Words a listing uses when it really is on or facing a lake. A street named "Lake Road" or "Lake Drive" does not count.
    filter: (project) => /lake ?front|lakeside|lake views?|lake and mountain views|overlooking (?:a |the )?(?:[a-z]+ )?lake\b|beside (?:a |the )?lake\b|facing (?:[a-z]+ )?lake\b|beira lake/i.test(`${project.name} ${project.summary} ${project.description} ${project.location}`),
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
// Extra words people type for each collection page (header and home search suggestions).
const searchSynonyms: Record<string, string> = {
  "/projects/luxury": "luxury premium high end upscale",
  "/projects/beachfront": "beachfront beach sea ocean seafront coastal",
  "/projects/lakefront": "lakefront lake lakeside lake view waterfront reservoir",
  "/projects/villas": "villa villas",
  "/projects/pre-construction": "pre construction precon pre con off plan offplan upcoming",
  "/projects/serviced-apartments": "serviced apartment hotel managed",
  "/projects/branded-residences": "branded residence residences hotel",
  "/projects/colombo": "colombo apartments city",
};

export const searchablePages: SearchablePage[] = [
  { label: "New Projects", path: "/projects", keywords: "new projects all projects new homes" },
  ...allProjectCategories.map((category) => ({
    label: category.h1,
    path: category.path,
    keywords: `${category.breadcrumbLabel} ${category.h1} ${category.extraKeywords ?? ""} ${searchSynonyms[category.path] ?? ""}`.toLowerCase().trim(),
  })),
  { label: "Land for Sale in Sri Lanka", path: "/land", keywords: "land lands plot plots" },
  { label: "Best Land for Sale in Colombo", path: "/land/best-land-for-sale-in-colombo", keywords: "best land for sale in colombo land colombo plots plot colombo land for sale colombo district" },
  { label: "Cheap Land for Sale in Sri Lanka", path: "/land/cheap-land-for-sale-in-sri-lanka", keywords: "cheap land for sale sri lanka low price land affordable plots lowest price per perch" },
  { label: "1 Acre Land for Sale in Sri Lanka", path: "/land/1-acre-land-for-sale-in-sri-lanka", keywords: "1 acre land for sale in sri lanka one acre land price acre 160 perches" },
  { label: "Rural Land for Sale in Sri Lanka", path: "/land/rural-land-for-sale-in-sri-lanka", keywords: "rural land for sale in sri lanka village land countryside land outside colombo" },
  { label: "Farm Land for Sale in Sri Lanka", path: "/land/farm-land-for-sale-in-sri-lanka", keywords: "farm land for sale in sri lanka agricultural land coconut land paddy land plantation" },
];

export function buildCategoryMetadata(category: ProjectCategory): Metadata {
  return withSocial({
    title: category.metaTitle,
    description: category.metaDescription,
    alternates: {
      canonical: category.path,
    },
  });
}

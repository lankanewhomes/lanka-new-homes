import { projectCategories } from "@/lib/listing-categories";
import { LAND_SEO_PAGES } from "@/lib/land-seo-pages";
import type { Land, Project } from "@/types";

// The homepage "Popular searches" block (owner, 2026-10-14: "if there are no listings, don't add it to the popular searches").
// Every link is checked against the real listings with the same rule its target page uses, so a link only shows when its page has
// results. A group with no links left is dropped too. Computed on the server (page.tsx), so the HTML never lists a dead link.

export type PopularLink = { label: string; href: string };
export type PopularGroup = { title: string; links: PopularLink[] };

const has = (value: string | undefined, needle: string) => (value ?? "").toLowerCase().includes(needle.toLowerCase());
// Same location rule as /projects?location= and /land?location=.
const projectIn = (p: Project, place: string) => has(p.location, place) || has(p.city, place) || has(p.district, place);
const landIn = (l: Land, place: string) => has(l.location, place) || has(l.city, place) || has(l.district, place);
const inColombo = (l: Land) => (l.district ?? "").toLowerCase() === "colombo" || /colombo/i.test(`${l.city ?? ""} ${l.location ?? ""}`);
const BEACH = /beach|seafront|oceanfront|sea view|coastal/i;
const categoryCount = (key: string, projects: Project[]) => projects.filter(projectCategories[key].filter).length;

export function popularSearchGroups(projects: Project[], lands: Land[]): PopularGroup[] {
  const house = (place: string) => projects.filter((p) => p.type === "House" && projectIn(p, place)).length;
  const apartments = (place: string) => projects.filter((p) => p.type === "Apartments" && projectIn(p, place)).length;
  const landUse = (use: string) => lands.filter((l) => (l.landUse ?? []).includes(use as Land["landUse"][number])).length;

  const defs: { title: string; links: (PopularLink & { count: number })[] }[] = [
    {
      title: "Land",
      links: [
        { label: "Best land for sale in Colombo", href: "/land/best-land-for-sale-in-colombo", count: lands.filter(inColombo).length },
        { label: "Cheap land for sale in Sri Lanka", href: "/land/cheap-land-for-sale-in-sri-lanka", count: LAND_SEO_PAGES.cheap.select(lands).length },
        { label: "1 acre land for sale in Sri Lanka", href: "/land/1-acre-land-for-sale-in-sri-lanka", count: LAND_SEO_PAGES.acre.select(lands).length },
        { label: "Rural land for sale in Sri Lanka", href: "/land/rural-land-for-sale-in-sri-lanka", count: LAND_SEO_PAGES.rural.select(lands).length },
        { label: "Land for sale in Nuwara Eliya", href: "/land?location=Nuwara+Eliya", count: lands.filter((l) => landIn(l, "Nuwara Eliya")).length },
        { label: "Residential land for sale", href: "/land?landUse=Residential", count: landUse("Residential") },
        { label: "Agricultural land for sale", href: "/land?landUse=Agricultural", count: landUse("Agricultural") },
        { label: "Beachfront land for sale in Sri Lanka", href: "/land", count: lands.filter((l) => BEACH.test(`${l.title} ${l.location ?? ""} ${l.summary ?? ""} ${l.description ?? ""}`)).length },
      ],
    },
    {
      title: "Houses",
      links: [
        { label: "House for sale in Kandy", href: "/projects?type=House&location=Kandy", count: house("Kandy") },
        { label: "Houses for sale in Wattala", href: "/projects?type=House&location=Wattala", count: house("Wattala") },
        { label: "Houses for sale in Kottawa", href: "/projects?type=House&location=Kottawa", count: house("Kottawa") },
        { label: "Houses for sale in Thalawathugoda", href: "/projects?type=House&location=Thalawathugoda", count: house("Thalawathugoda") },
      ],
    },
    {
      title: "Apartments & condominiums",
      links: [
        { label: "Apartments for sale in Colombo", href: "/projects/colombo", count: categoryCount("colombo", projects) },
        { label: "New luxury apartments in Sri Lanka", href: "/projects/luxury", count: categoryCount("luxury", projects) },
        { label: "Port City Colombo apartments", href: "/projects/port-city-colombo", count: categoryCount("port-city-colombo", projects) },
        { label: "Apartments for sale in Dehiwala", href: "/projects?type=Apartments&location=Dehiwala", count: apartments("Dehiwala") },
        { label: "Serviced apartments in Sri Lanka", href: "/projects/serviced-apartments", count: categoryCount("serviced-apartments", projects) },
      ],
    },
    {
      title: "New developments",
      links: [
        { label: "New projects in Sri Lanka", href: "/projects", count: projects.length },
        { label: "New villa developments in Sri Lanka", href: "/projects/villas", count: categoryCount("villas", projects) },
        { label: "Beachfront condo developments", href: "/projects/beachfront", count: categoryCount("beachfront", projects) },
        { label: "Branded residences in Sri Lanka", href: "/projects/branded-residences", count: categoryCount("branded-residences", projects) },
        { label: "Pre-construction & off-plan projects", href: "/projects/pre-construction", count: categoryCount("pre-construction", projects) },
      ],
    },
  ];
  return defs
    .map((g) => ({ title: g.title, links: g.links.filter((l) => l.count > 0).map(({ label, href }) => ({ label, href })) }))
    .filter((g) => g.links.length > 0);
}

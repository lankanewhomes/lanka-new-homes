import { guides, buildGuideMetadata } from "@/lib/guides";
import { getAllProjects } from "@/lib/project-store";
import { PriceGuidePage } from "@/components/marketplace/price-guide-page";
import type { Project } from "@/types";

export const revalidate = 3600;

const guide = guides["apartment-prices-in-colombo"];
export const metadata = buildGuideMetadata(guide);

const isApartment = (p: Project) => /apartment|condominium|penthouse/i.test(p.type ?? "");
const place = (p: Project) => `${p.city ?? ""} | ${p.location ?? ""}`;

// "Colombo 02" and "Colombo 2" are the same postcode; projects with no postcode go under "Colombo (general)".
function areaOf(p: Project): string {
  if (/port city/i.test(place(p))) return "Port City Colombo";
  const postcode = /colombo\s*0?(\d{1,2})\b/i.exec(place(p));
  if (postcode) return `Colombo ${Number(postcode[1])}`;
  if (/rajagiriya|kotte|battaramulla/i.test(place(p))) return "Rajagiriya and Kotte";
  return "Colombo (area not set)";
}

export default async function ApartmentPricesInColomboPage() {
  const projects = (await getAllProjects()).filter(
    (p) => isApartment(p) && (/colombo/i.test(place(p)) || /rajagiriya|pita kotte|kotte/i.test(place(p))) && String(p.status) !== "Sold Out",
  );
  return (
    <PriceGuidePage
      guide={guide}
      projects={projects}
      areaOf={areaOf}
      areaNoun="area"
      listingsHref="/projects/colombo"
      updated="November 2026"
      bands={[
        { label: "Under Rs. 60 million", min: 1, max: 60_000_000 },
        { label: "Rs. 60 to 100 million", min: 60_000_000, max: 100_000_000 },
        { label: "Rs. 100 to 200 million", min: 100_000_000, max: 200_000_000 },
        { label: "Rs. 200 million and above", min: 200_000_000, max: Infinity },
      ]}
    />
  );
}

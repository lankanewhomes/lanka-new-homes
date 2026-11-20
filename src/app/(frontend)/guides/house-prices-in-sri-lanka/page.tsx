import { guides, buildGuideMetadata } from "@/lib/guides";
import { getAllProjects } from "@/lib/project-store";
import { PriceGuidePage } from "@/components/marketplace/price-guide-page";
import type { Project } from "@/types";

export const revalidate = 3600;

const guide = guides["house-prices-in-sri-lanka"];
export const metadata = buildGuideMetadata(guide);

const isHouse = (p: Project) => ["house", "villas", "luxury villas", "townhouse"].includes((p.type ?? "").toLowerCase());

export default async function HousePricesPage() {
  const projects = (await getAllProjects()).filter((p) => isHouse(p) && String(p.status) !== "Sold Out");
  return (
    <PriceGuidePage
      guide={guide}
      projects={projects}
      areaOf={(p) => (p.city || p.district || "Other").trim()}
      areaNoun="town"
      listingsHref="/projects/villas"
      updated="November 2026"
      bands={[
        { label: "Under Rs. 50 million", min: 1, max: 50_000_000 },
        { label: "Rs. 50 to 100 million", min: 50_000_000, max: 100_000_000 },
        { label: "Rs. 100 million and above", min: 100_000_000, max: Infinity },
      ]}
    />
  );
}

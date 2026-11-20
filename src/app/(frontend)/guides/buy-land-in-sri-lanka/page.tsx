import { guides, buildGuideMetadata } from "@/lib/guides";
import { GuidePageShell } from "@/components/marketplace/guide-page";
import { getAllLands } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { slimForHome } from "@/lib/home-slim";

export const revalidate = 3600;

const guide = guides["buy-land-in-sri-lanka"];
export const metadata = buildGuideMetadata(guide);

export default async function BuyLandGuidePage() {
  const lands = (await getAllLands()).slice(0, 8).map(landToProjectShape).map(slimForHome);
  return <GuidePageShell guide={guide} lands={lands} />;
}

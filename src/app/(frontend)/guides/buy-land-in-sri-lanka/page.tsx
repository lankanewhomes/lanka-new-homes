import { guides, buildGuideMetadata } from "@/lib/guides";
import { GuidePageShell } from "@/components/marketplace/guide-page";

const guide = guides["buy-land-in-sri-lanka"];
export const metadata = buildGuideMetadata(guide);

export default function BuyLandGuidePage() {
  return <GuidePageShell guide={guide} />;
}

import { guides, buildGuideMetadata } from "@/lib/guides";
import { GuidePageShell } from "@/components/marketplace/guide-page";

const guide = guides["apartment-prices-in-colombo"];
export const metadata = buildGuideMetadata(guide);

export default function ApartmentPricesInColomboGuidePage() {
  return <GuidePageShell guide={guide} />;
}

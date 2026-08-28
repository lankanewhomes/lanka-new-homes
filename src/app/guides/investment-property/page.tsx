import { guides, buildGuideMetadata } from "@/lib/guides";
import { GuidePageShell } from "@/components/marketplace/guide-page";

const guide = guides["investment-property"];
export const metadata = buildGuideMetadata(guide);

export default function InvestmentPropertyGuidePage() {
  return <GuidePageShell guide={guide} />;
}

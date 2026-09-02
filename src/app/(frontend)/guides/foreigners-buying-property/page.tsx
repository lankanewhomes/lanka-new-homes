import { guides, buildGuideMetadata } from "@/lib/guides";
import { GuidePageShell } from "@/components/marketplace/guide-page";

const guide = guides["foreigners-buying-property"];
export const metadata = buildGuideMetadata(guide);

export default function ForeignersBuyingPropertyGuidePage() {
  return <GuidePageShell guide={guide} />;
}

import { guides, buildGuideMetadata } from "@/lib/guides";
import { GuidePageShell } from "@/components/marketplace/guide-page";

const guide = guides["golden-visa"];
export const metadata = buildGuideMetadata(guide);

export default function GoldenVisaGuidePage() {
  return <GuidePageShell guide={guide} />;
}

import type { Metadata } from "next";
import { HALCYON_THEME } from "@/components/web-design-sample/sample-data";
import { SampleSite } from "@/components/web-design-sample/sample-site";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: HALCYON_THEME.metaTitle,
  description: HALCYON_THEME.metaDescription,
}, { path: "/web-design/sample" });

// The default sample — Halcyon Residences, garden villas. Meridian Heights
// and Azure Cove live as sibling routes (./meridian, ./azure-cove).
export default function SamplePage() {
  return <SampleSite />;
}

import type { Metadata } from "next";
import { HALCYON_THEME } from "@/components/web-design-sample/sample-data";
import { SampleSite } from "@/components/web-design-sample/sample-site";

export const metadata: Metadata = {
  title: HALCYON_THEME.metaTitle,
  description: HALCYON_THEME.metaDescription,
};

// The default sample — Halcyon Residences, garden villas. Meridian Heights
// and Azure Cove live as sibling routes (./meridian, ./azure-cove).
export default function SamplePage() {
  return <SampleSite />;
}

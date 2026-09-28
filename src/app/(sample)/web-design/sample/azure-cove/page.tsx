import type { Metadata } from "next";
import { AZURE_COVE_THEME } from "@/components/web-design-sample/theme-azure-cove";
import { SampleSite } from "@/components/web-design-sample/sample-site";

export const metadata: Metadata = {
  title: AZURE_COVE_THEME.metaTitle,
  description: AZURE_COVE_THEME.metaDescription,
};

// Third sample — Azure Cove, beachfront villas. Same wrapper-div font
// pattern as Meridian's route — see theme-azure-cove.ts.
export default function AzureCoveSamplePage() {
  return (
    <div className={AZURE_COVE_THEME.fontVariables}>
      <SampleSite theme={AZURE_COVE_THEME} />
    </div>
  );
}

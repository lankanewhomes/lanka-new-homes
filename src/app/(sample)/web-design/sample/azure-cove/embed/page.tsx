import { AZURE_COVE_THEME } from "@/components/web-design-sample/theme-azure-cove";
import { SampleSite } from "@/components/web-design-sample/sample-site";

// The same sample without the "this is a sample" bar — loaded by the device
// frames on /web-design (see web-design-sample-switcher.tsx).
export default function AzureCoveSampleEmbedPage() {
  return (
    <div className={AZURE_COVE_THEME.fontVariables}>
      <SampleSite theme={AZURE_COVE_THEME} embedded />
    </div>
  );
}

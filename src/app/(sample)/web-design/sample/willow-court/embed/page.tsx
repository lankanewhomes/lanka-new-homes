import { WILLOW_COURT_THEME } from "@/components/web-design-sample/theme-willow-court";
import { SampleSite } from "@/components/web-design-sample/sample-site";

// The same sample without the "this is a sample" bar — loaded by the device
// frames on /web-design (see web-design-sample-switcher.tsx).
export default function WillowCourtSampleEmbedPage() {
  return (
    <div className={WILLOW_COURT_THEME.fontVariables}>
      <SampleSite theme={WILLOW_COURT_THEME} embedded />
    </div>
  );
}

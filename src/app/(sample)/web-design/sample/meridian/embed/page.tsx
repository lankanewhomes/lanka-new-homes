import { MERIDIAN_THEME } from "@/components/web-design-sample/theme-meridian";
import { SampleSite } from "@/components/web-design-sample/sample-site";

// The same sample without the "this is a sample" bar — loaded by the device
// frames on /web-design (see web-design-sample-switcher.tsx).
export default function MeridianSampleEmbedPage() {
  return (
    <div className={MERIDIAN_THEME.fontVariables}>
      <SampleSite theme={MERIDIAN_THEME} embedded />
    </div>
  );
}

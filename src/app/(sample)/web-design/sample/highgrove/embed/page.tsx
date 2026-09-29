import { HIGHGROVE_THEME } from "@/components/web-design-sample/theme-highgrove";
import { SampleSite } from "@/components/web-design-sample/sample-site";

// The same sample without the "this is a sample" bar — loaded by the device
// frames on /web-design (see web-design-sample-switcher.tsx).
export default function HighgroveSampleEmbedPage() {
  return (
    <div className={HIGHGROVE_THEME.fontVariables}>
      <SampleSite theme={HIGHGROVE_THEME} embedded />
    </div>
  );
}

import { OBSIDIAN_THEME } from "@/components/web-design-sample/theme-obsidian";
import { SampleSite } from "@/components/web-design-sample/sample-site";

// The same sample without the "this is a sample" bar — loaded by the device
// frames on /web-design (see web-design-sample-switcher.tsx).
export default function ObsidianSampleEmbedPage() {
  return (
    <div className={OBSIDIAN_THEME.fontVariables}>
      <SampleSite theme={OBSIDIAN_THEME} embedded />
    </div>
  );
}

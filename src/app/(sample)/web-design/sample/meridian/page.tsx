import type { Metadata } from "next";
import { MERIDIAN_THEME } from "@/components/web-design-sample/theme-meridian";
import { SampleSite } from "@/components/web-design-sample/sample-site";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: MERIDIAN_THEME.metaTitle,
  description: MERIDIAN_THEME.metaDescription,
}, { path: "/web-design/sample/meridian" });

// Second sample — Meridian Heights, a Colombo apartment tower. The
// `fontVariables` wrapper shadows the Cormorant/DM Sans variables the parent
// (sample) layout sets on <html> (Halcyon's own fonts) with Meridian's own
// Space Grotesk + Inter pair, for everything inside this div — see
// theme-meridian.ts and (sample)/layout.tsx's own comment.
export default function MeridianSamplePage() {
  return (
    <div className={MERIDIAN_THEME.fontVariables}>
      <SampleSite theme={MERIDIAN_THEME} />
    </div>
  );
}

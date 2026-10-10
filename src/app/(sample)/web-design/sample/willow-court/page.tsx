import type { Metadata } from "next";
import { WILLOW_COURT_THEME } from "@/components/web-design-sample/theme-willow-court";
import { SampleSite } from "@/components/web-design-sample/sample-site";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: WILLOW_COURT_THEME.metaTitle,
  description: WILLOW_COURT_THEME.metaDescription,
}, { path: "/web-design/sample/willow-court" });

// Sixth sample — Willow Court, mid-market family townhouses. The
// `fontVariables` wrapper shadows the Cormorant/DM Sans variables the parent
// (sample) layout sets on <html> (Halcyon's own fonts) with Willow Court's
// own Poppins + Source Sans 3 pair, for everything inside this div — see
// theme-willow-court.ts and (sample)/layout.tsx's own comment.
export default function WillowCourtSamplePage() {
  return (
    <div className={WILLOW_COURT_THEME.fontVariables}>
      <SampleSite theme={WILLOW_COURT_THEME} />
    </div>
  );
}

import type { Metadata } from "next";
import { HIGHGROVE_THEME } from "@/components/web-design-sample/theme-highgrove";
import { SampleSite } from "@/components/web-design-sample/sample-site";

export const metadata: Metadata = {
  title: HIGHGROVE_THEME.metaTitle,
  description: HIGHGROVE_THEME.metaDescription,
};

// Fifth sample — Highgrove Estate, hillside tea-estate villas. The
// `fontVariables` wrapper shadows the Cormorant/DM Sans variables the parent
// (sample) layout sets on <html> (Halcyon's own fonts) with Highgrove's own
// Newsreader + Karla pair, for everything inside this div — see
// theme-highgrove.ts and (sample)/layout.tsx's own comment.
export default function HighgroveSamplePage() {
  return (
    <div className={HIGHGROVE_THEME.fontVariables}>
      <SampleSite theme={HIGHGROVE_THEME} />
    </div>
  );
}

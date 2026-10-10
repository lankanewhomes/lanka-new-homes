import type { Metadata } from "next";
import { OBSIDIAN_THEME } from "@/components/web-design-sample/theme-obsidian";
import { SampleSite } from "@/components/web-design-sample/sample-site";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: OBSIDIAN_THEME.metaTitle,
  description: OBSIDIAN_THEME.metaDescription,
}, { path: "/web-design/sample/obsidian" });

// Fourth sample — Obsidian Villas, the black-and-white theme. The
// `fontVariables` wrapper shadows the Cormorant/DM Sans variables the parent
// (sample) layout sets on <html> (Halcyon's own fonts) with Obsidian's own
// Archivo + Manrope pair, for everything inside this div — see
// theme-obsidian.ts and (sample)/layout.tsx's own comment.
export default function ObsidianSamplePage() {
  return (
    <div className={OBSIDIAN_THEME.fontVariables}>
      <SampleSite theme={OBSIDIAN_THEME} />
    </div>
  );
}

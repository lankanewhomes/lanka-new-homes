import type { Metadata } from "next";
import { LandDetail } from "@/components/land/land-detail";
import { DEMO_LAND } from "@/lib/demo-land";

// TEST ONLY: the made-up land community with the interactive lot map. Not linked anywhere, not in the sitemap, not indexed. Delete this folder
// and src/lib/demo-land.ts to remove it.
export const metadata: Metadata = { title: "Land demo (test)", robots: { index: false, follow: false } };

export default function LandDemoPage() {
  return (
    <div className="space-y-4">
      <p className="mx-auto max-w-5xl border border-dashed border-stone-400 bg-amber-50 px-4 py-2 text-sm text-stone-700">TEST PAGE: made-up land, not a real listing, not published. The interactive lot map shown here is not on any other listing.</p>
      <LandDetail land={DEMO_LAND} preview />
    </div>
  );
}

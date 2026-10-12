import { LandSeoPage, landSeoMetadata } from "@/lib/land-seo-pages";

// SEO landing page (owner, 2026-10-11) — see src/lib/land-seo-pages.tsx.
export const revalidate = 60;

export const generateMetadata = () => landSeoMetadata("cheap");

export default function Page() {
  return <LandSeoPage pageKey="cheap" />;
}

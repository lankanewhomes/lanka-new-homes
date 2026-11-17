import { LandSeoPage, landSeoMetadata } from "@/lib/land-seo-pages";

// SEO landing page (owner, 2026-11-16) — see LAND_TOWNS in src/lib/land-seo-pages.tsx.
export const revalidate = 60;

export const generateMetadata = () => landSeoMetadata("town-kaduwela");

export default function Page() {
  return <LandSeoPage pageKey="town-kaduwela" />;
}

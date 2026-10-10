import { redirect } from "next/navigation";

// The old Supabase-backed hero-ads admin panel is retired — HeroSlides now
// has full field parity (headline, review_note, archived status) and syncs
// one-way to the live hero_ads table, same pattern as Developers/Projects.
// Same friendly-alias pattern as /admin and /admin/dashboard.
export default async function AdminHeroAdsRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Keep any query string (utm_source etc.) on the way to the CMS.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  const qs = query.toString();
  redirect(qs ? `/cms?${qs}` : "/cms");
}

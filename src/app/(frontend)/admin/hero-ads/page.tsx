import { redirect } from "next/navigation";

// The old Supabase-backed hero-ads admin panel is retired — HeroSlides now
// has full field parity (headline, review_note, archived status) and syncs
// one-way to the live hero_ads table, same pattern as Developers/Projects.
// Same friendly-alias pattern as /admin and /admin/dashboard.
export default function AdminHeroAdsRedirect() {
  redirect("/cms");
}

// Reads the Featured packages and add-on bookings. In DEMO mode (see demo.ts) they are built in memory from real projects;
// otherwise they come from the featured_* tables (migration 20261121120000, not run yet): until the tables exist every read
// quietly returns "nothing booked", so every slot renders nothing.
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { getAllProjects } from "@/lib/project-store";
import { getAllDevelopers } from "@/lib/developer-store";
import type { Developer, Project } from "@/types";
import type { AddOnType, Placement } from "./config";
import { buildDemoState, FEATURED_DEMO, FEATURED_ENABLED } from "./demo";
import { activeBookings, featuredDevelopers, selectFeatured } from "./engine";
import type { AddOnBooking, FeaturedItem, FeaturedPackage, FeaturedState, SlotContext } from "./types";

type PackageRow = { id: string; developer_slug: string; tier: FeaturedPackage["tier"]; start_date: string; end_date: string; slots: number; project_slugs: string[] | null; founding_partner: boolean | null };
type AddonRow = { id: string; type: AddOnType; developer_slug: string; project_slug: string | null; city: string | null; start_date: string; end_date: string; creative_image: string | null; creative_headline: string | null; creative_subline: string | null; creative_cta_label: string | null; creative_cta_href: string | null };

async function loadFromDatabase(): Promise<FeaturedState> {
  try {
    const [packages, addons] = await Promise.all([
      supabaseAdmin.from("featured_packages").select("id, developer_slug, tier, start_date, end_date, slots, project_slugs, founding_partner"),
      supabaseAdmin.from("featured_addons").select("id, type, developer_slug, project_slug, city, start_date, end_date, creative_image, creative_headline, creative_subline, creative_cta_label, creative_cta_href"),
    ]);
    if (packages.error || addons.error) return { packages: [], bookings: [], demo: false }; // tables not created yet
    return {
      demo: false,
      packages: ((packages.data ?? []) as PackageRow[]).map((row) => ({
        id: row.id, developerSlug: row.developer_slug, tier: row.tier, startDate: row.start_date, endDate: row.end_date, slots: row.slots,
        projectSlugs: row.project_slugs ?? [], foundingPartner: Boolean(row.founding_partner),
      })),
      bookings: ((addons.data ?? []) as AddonRow[]).map((row) => ({
        id: row.id, type: row.type, developerSlug: row.developer_slug, projectSlug: row.project_slug ?? undefined, city: row.city ?? undefined,
        startDate: row.start_date, endDate: row.end_date,
        creative: row.creative_headline || row.creative_image || (row.type === "website-link" && row.creative_cta_href) ? { image: row.creative_image ?? "", headline: row.creative_headline ?? "", subline: row.creative_subline ?? undefined, ctaLabel: row.creative_cta_label ?? undefined, ctaHref: row.creative_cta_href ?? "/" } : undefined,
      })),
    };
  } catch {
    return { packages: [], bookings: [], demo: false };
  }
}

/** Everything a slot needs, loaded once per request. */
export const getFeaturedData = cache(async (): Promise<{ state: FeaturedState; projects: Project[]; developers: Developer[] }> => {
  if (!FEATURED_ENABLED) return { state: { packages: [], bookings: [], demo: false }, projects: [], developers: [] }; // switched off: no reads at all
  const [projects, developers] = await Promise.all([getAllProjects(), getAllDevelopers()]);
  const state = FEATURED_DEMO ? buildDemoState(projects, developers) : await loadFromDatabase();
  return { state, projects, developers };
});

export async function getFeaturedProjects(placement: Placement, ctx: SlotContext = {}): Promise<FeaturedItem[]> {
  const { state, projects } = await getFeaturedData();
  return selectFeatured(state, projects, placement, ctx);
}

export async function getFeaturedDeveloperList(placement: Placement, limit = 12) {
  const { state, developers } = await getFeaturedData();
  const bySlug = new Map(developers.map((developer) => [developer.slug, developer]));
  return featuredDevelopers(state, placement, new Date(), limit).flatMap((entry) => {
    const developer = bySlug.get(entry.developerSlug);
    return developer ? [{ ...entry, developer }] : [];
  });
}

export async function getActiveBookings(type: AddOnType, now = new Date()): Promise<AddOnBooking[]> {
  const { state } = await getFeaturedData();
  return activeBookings(state, now, type);
}

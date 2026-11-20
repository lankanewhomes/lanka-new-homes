// Server-side helpers for the /dashboard/featured screens: who may manage which developer's package, and the writes themselves.
// While FEATURED_DEMO is on, nothing is ever written (see demo.ts): every write returns { demo: true }.
import { getPayload } from "payload";
import config from "../../../payload.config";
import { supabaseAdmin } from "@/lib/supabase";
import type { Session } from "@/app/(dashboard)/dashboard/_data/session";
import { ADD_ONS, TIERS, type AddOnType, type FeaturedTier } from "./config";
import { FEATURED_DEMO } from "./demo";
import { toDay } from "./engine";
import { getFeaturedData } from "./store";

export type WriteResult = { ok: boolean; message: string; demo?: boolean };

/** The developer slugs this session may manage: every developer for an admin, the company's own for a developer login. */
export async function manageableDeveloperSlugs(session: Session): Promise<string[] | "all"> {
  if (session.role === "admin") return "all";
  if (!session.developerIds.length) return [];
  const payload = await getPayload({ config });
  const found = await payload.find({ collection: "developers", where: { id: { in: session.developerIds } }, limit: 50, depth: 0, overrideAccess: true, select: { slug: true } });
  return found.docs.map((doc) => String((doc as { slug?: string }).slug ?? "")).filter(Boolean);
}

const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const DEMO_RESULT: WriteResult = { ok: false, demo: true, message: "Demo preview: nothing was saved. Saving is switched off while the demo flag is on." };

export async function assignPackage(session: Session, input: { developerSlug: string; tier: FeaturedTier; startDate: string; endDate: string; foundingPartner: boolean }): Promise<WriteResult> {
  if (session.role !== "admin") return { ok: false, message: "Only an admin can assign a package." };
  if (!TIERS[input.tier]) return { ok: false, message: "Unknown tier." };
  if (!isDay(input.startDate) || !isDay(input.endDate) || input.endDate < input.startDate) return { ok: false, message: "Check the start and end dates." };
  if (FEATURED_DEMO) return DEMO_RESULT;
  const { error } = await supabaseAdmin.from("featured_packages").insert({
    id: id("pkg"), developer_slug: input.developerSlug, tier: input.tier, start_date: input.startDate, end_date: input.endDate,
    slots: TIERS[input.tier].projectSlots, project_slugs: [], founding_partner: input.foundingPartner,
  });
  return error ? { ok: false, message: `Not saved: ${error.message}` } : { ok: true, message: "Package assigned. Now pick its projects." };
}

/** Pick (or swap) the projects filling a package's slots. Developers may do this for their own package until its end date. */
export async function savePackageProjects(session: Session, packageId: string, projectSlugs: string[]): Promise<WriteResult> {
  const { state, projects } = await getFeaturedData();
  const pkg = state.packages.find((entry) => entry.id === packageId);
  if (!pkg) return { ok: false, message: "Package not found." };
  const allowed = await manageableDeveloperSlugs(session);
  if (allowed !== "all" && !allowed.includes(pkg.developerSlug)) return { ok: false, message: "That package belongs to another company." };
  if (toDay(new Date()) > pkg.endDate) return { ok: false, message: "This package has ended, so its projects can no longer be changed." };
  const unique = [...new Set(projectSlugs)];
  if (unique.length > pkg.slots) return { ok: false, message: `This package has ${pkg.slots} ${pkg.slots === 1 ? "slot" : "slots"}; you picked ${unique.length}.` };
  const own = new Set(projects.filter((project) => project.developerSlug === pkg.developerSlug).map((project) => project.slug));
  if (unique.some((slug) => !own.has(slug))) return { ok: false, message: "A package can only feature the company's own projects." };
  if (FEATURED_DEMO) return DEMO_RESULT;
  const { error } = await supabaseAdmin.from("featured_packages").update({ project_slugs: unique }).eq("id", packageId);
  return error ? { ok: false, message: `Not saved: ${error.message}` } : { ok: true, message: "Projects updated. The change shows on the site within a minute." };
}

export async function bookAddon(session: Session, input: { type: AddOnType; developerSlug: string; projectSlug?: string; city?: string; startDate: string; endDate: string; image?: string; headline?: string; subline?: string; ctaLabel?: string; ctaHref?: string }): Promise<WriteResult> {
  if (session.role !== "admin") return { ok: false, message: "Only an admin can book add-ons." };
  const info = ADD_ONS[input.type];
  if (!info) return { ok: false, message: "Unknown add-on." };
  if (!isDay(input.startDate) || !isDay(input.endDate) || input.endDate < input.startDate) return { ok: false, message: "Check the start and end dates." };
  if (input.type === "city-tile" && !input.city) return { ok: false, message: "Pick the city for the city tile." };
  if (FEATURED_DEMO) return DEMO_RESULT;
  const { error } = await supabaseAdmin.from("featured_addons").insert({
    id: id("add"), type: input.type, developer_slug: input.developerSlug, project_slug: input.projectSlug || null, city: input.city || null,
    start_date: input.startDate, end_date: input.endDate, creative_image: input.image || null, creative_headline: input.headline || null,
    creative_subline: input.subline || null, creative_cta_label: input.ctaLabel || null, creative_cta_href: input.ctaHref || null, price_lkr: info.priceLkr,
  });
  return error ? { ok: false, message: `Not saved: ${error.message}` } : { ok: true, message: "Add-on booked." };
}

/** Uploads a creative image to the media library (the R2 bucket) and returns its public URL. Not run in the demo. */
export async function uploadCreative(file: File): Promise<string | null> {
  if (FEATURED_DEMO || !file || file.size === 0) return null;
  const payload = await getPayload({ config });
  const created = await payload.create({
    collection: "media",
    data: { alt: file.name },
    file: { data: Buffer.from(await file.arrayBuffer()), mimetype: file.type, name: file.name, size: file.size },
    overrideAccess: true,
  });
  return (created as { url?: string }).url ?? null;
}

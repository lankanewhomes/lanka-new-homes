// Link-in-bio lists for the Instagram pages (/links, /links/projects, /links/land). Built from the `social-posts`
// collection: every published Instagram post is logged there. Newest first, one row per listing, each linking to the
// listing with the same Instagram UTM tags the captions use. Posts deleted on Instagram (removedAt set) are left out.

import type { Where } from "payload";

export type BioLink = { slug: string; name: string; area: string | null; price: string | null; image: string | null; href: string; postedAt: string };

const LIVE_INSTAGRAM: Where[] = [{ platform: { equals: "instagram" } }, { status: { equals: "published" } }, { removedAt: { exists: false } }];

async function getPayloadClient() {
  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../payload.config")).default;
  return getPayload({ config: payloadConfig });
}

export async function getProjectLinks(): Promise<BioLink[]> {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "social-posts",
      where: { and: [...LIVE_INSTAGRAM, { project: { exists: true } }] },
      sort: "-postedAt",
      limit: 60,
      depth: 1,
      overrideAccess: true,
    });
    const seen = new Set<string>();
    const links: BioLink[] = [];
    for (const doc of docs as unknown as { postedAt?: string; thumbnailUrl?: string | null; mediaUrl?: string | null; project?: unknown }[]) {
      const project = doc.project as { slug?: string; name?: string; city?: string | null; city_other?: string | null; district?: string | null; priceRange?: string | null; startingPriceLkr?: number | null; heroImage?: string | null; isPublished?: boolean } | null;
      if (!project?.slug || !project.name || project.isPublished === false || seen.has(project.slug)) continue;
      seen.add(project.slug);
      const postedAt = doc.postedAt ?? new Date().toISOString();
      const campaign = `${project.slug}-social-${postedAt.slice(0, 7)}`;
      links.push({
        slug: project.slug,
        name: project.name,
        // city is empty when the area isn't in the city list (e.g. "Colombo 07", "South Coast"); fall back to city_other, then district.
        area: (project.city && project.city !== "Other" ? project.city : project.city_other || project.district) || null,
        price: project.priceRange || (project.startingPriceLkr ? `From Rs. ${project.startingPriceLkr.toLocaleString("en-US")}` : null),
        image: doc.thumbnailUrl || doc.mediaUrl || project.heroImage || null,
        href: `/projects/${project.slug}?utm_source=instagram&utm_medium=social&utm_campaign=${encodeURIComponent(campaign)}`,
        postedAt,
      });
    }
    return links;
  } catch {
    return [];
  }
}

export async function getLandLinks(): Promise<BioLink[]> {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "social-posts",
      where: { and: [...LIVE_INSTAGRAM, { land: { exists: true } }] },
      sort: "-postedAt",
      limit: 60,
      depth: 1,
      overrideAccess: true,
    });
    const seen = new Set<string>();
    const links: BioLink[] = [];
    for (const doc of docs as unknown as { postedAt?: string; thumbnailUrl?: string | null; mediaUrl?: string | null; land?: unknown }[]) {
      const land = doc.land as { slug?: string; title?: string; status?: string; location?: string | null; city?: string | null; city_other?: string | null; district?: string | null; priceLkr?: number | null; pricePerPerchLkrMin?: number | null; pricePerPerchLkrMax?: number | null; heroImage?: string | null } | null;
      if (!land?.slug || !land.title || land.status === "Sold" || seen.has(land.slug)) continue;
      seen.add(land.slug);
      const postedAt = doc.postedAt ?? new Date().toISOString();
      const campaign = `${land.slug}-social-${postedAt.slice(0, 7)}`;
      const min = land.pricePerPerchLkrMin ?? 0;
      const max = land.pricePerPerchLkrMax ?? 0;
      // Only prices the developer published: a whole-plot price, else the per-perch figure(s), else nothing.
      const price = land.priceLkr && land.priceLkr > 0
        ? `Rs. ${land.priceLkr.toLocaleString("en-US")}`
        : min && max && min !== max
          ? `Rs. ${min.toLocaleString("en-US")} to ${max.toLocaleString("en-US")} per perch`
          : min || max
            ? `From Rs. ${(min || max).toLocaleString("en-US")} per perch`
            : null;
      links.push({
        slug: land.slug,
        name: land.title,
        area: (land.location || (land.city && land.city !== "Other" ? land.city : land.city_other) || land.district) || null,
        price,
        image: doc.thumbnailUrl || doc.mediaUrl || land.heroImage || null,
        href: `/land/${land.slug}?utm_source=instagram&utm_medium=social&utm_campaign=${encodeURIComponent(campaign)}`,
        postedAt,
      });
    }
    return links;
  } catch {
    return [];
  }
}

export function formatPostDate(iso: string | undefined): string | null {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Colombo" }) : null;
}

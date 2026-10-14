import { apiCount, apiFind, type Where } from "./api";
import { allOf } from "./scope";

// The summary strips and status tabs that sit above each list. They mirror what /cms shows (CompanyListSummary, DeveloperListTabs,
// LandListSummary, CollectionStatusTabs, MediaListTabs): same numbers, same rules, so the two screens never disagree. Counts respect
// the signed-in user's scope.

export type Tab = { key: string; label: string; where: Where | null };
export type Tile = { label: string; value: string };

const status = (field: string, values: [string, string][]): Tab[] => [
  { key: "all", label: "All", where: null },
  ...values.map(([label, value]) => ({ key: value, label, where: { [field]: { equals: value } } })),
];

export const TABS: Record<string, Tab[]> = {
  developers: [
    { key: "all", label: "All", where: null },
    { key: "verified", label: "Verified", where: { domain_verified: { equals: true } } },
    { key: "pending", label: "Waiting for review", where: { verification_status: { equals: "pending" } } },
    { key: "approved", label: "Approved", where: { verification_status: { equals: "approved" } } },
    { key: "rejected", label: "Rejected", where: { verification_status: { equals: "rejected" } } },
  ],
  projects: [
    { key: "all", label: "All", where: null },
    { key: "published", label: "Published", where: { isPublished: { equals: true } } },
    { key: "drafts", label: "Drafts", where: { isPublished: { equals: false } } },
  ],
  lands: status("status", [["Available", "Available"], ["Reserved", "Reserved"], ["Sold", "Sold"]]),
  leads: status("status", [["New", "new"], ["Contacted", "contacted"], ["Site visit", "site_visit"], ["Closed", "closed"]]),
  reviews: status("status", [["Pending", "pending"], ["Approved", "approved"], ["Rejected", "rejected"]]),
  payments: status("status", [["Pending", "pending"], ["Completed", "completed"], ["Failed", "failed"], ["Refunded", "refunded"]]),
  "hero-slides": status("status", [["Pending", "pending"], ["Active", "active"], ["Rejected", "rejected"], ["Archived", "archived"]]),
  "plan-waitlist": status("status", [["New", "new"], ["Contacted", "contacted"], ["Converted", "converted"], ["Not interested", "not_interested"]]),
  media: [
    { key: "all", label: "All", where: null },
    { key: "images", label: "Images", where: { mimeType: { like: "image/" } } },
    { key: "videos", label: "Videos", where: { mimeType: { like: "video/" } } },
    { key: "pdfs", label: "PDFs", where: { mimeType: { like: "application/pdf" } } },
  ],
};

const DIRECTORIES = ["developers", "construction-companies", "marketing-companies", "sales-companies", "architects", "interior-designers"];
const blank = (field: string): Where => ({ or: [{ [field]: { exists: false } }, { [field]: { equals: "" } }] });
const n = (v: number) => v.toLocaleString("en-LK");

/** Summary tiles for a collection, or null when it has none. */
export async function loadTiles(slug: string, scope: Where | null, role: "admin" | "developer"): Promise<Tile[] | null> {
  const count = (where?: Where | null) => apiCount(slug, allOf(scope, where));

  if (DIRECTORIES.includes(slug)) {
    if (role !== "admin") return null; // platform-wide counts: admins only
    const dev = slug === "developers";
    const [total, noLogo, noEmail, noPhone, verified, pending] = await Promise.all([
      count(), count(blank("logo")), count(blank("contact_email")), count(blank("contact_phone")),
      dev ? count({ domain_verified: { equals: true } }) : 0, dev ? count({ verification_status: { equals: "pending" } }) : 0,
    ]);
    return [
      { value: n(total), label: "In the directory" },
      { value: n(total - noLogo), label: "With a logo" },
      { value: n(Math.max(0, total - Math.max(noEmail, noPhone))), label: "With email and phone" },
      ...(dev ? [{ value: n(verified), label: "Verified Developers" }, { value: n(pending), label: "Waiting for review" }] : [{ value: n(noLogo), label: "Still need a logo" }]),
    ];
  }

  if (slug === "lands") {
    // Plots in total: the plots listed one by one, or the developer-published plot count where a land has no rows (same rule as the
    // homepage "Land Plots" number).
    const plotPages = apiFind("lands", { limit: 1000, where: scope, select: { plotCount: true, plots: { name: true } } });
    const [total, available, noPhoto, noPrice, plots] = await Promise.all([
      count(), count({ status: { equals: "Available" } }), count(blank("heroImage")),
      count({ or: [{ priceLkr: { exists: false } }, { priceLkr: { equals: 0 } }] }), plotPages,
    ]);
    const plotTotal = plots.docs.reduce((sum, land) => {
      const rows = Array.isArray(land.plots) ? land.plots.length : 0;
      const published = typeof land.plotCount === "number" ? land.plotCount : 0;
      return sum + (rows || published);
    }, 0);
    return [
      { value: n(total), label: "Land listings" },
      { value: n(plotTotal), label: "Plots in total" },
      { value: n(available), label: "Available" },
      { value: n(total - noPhoto), label: "With a photo" },
      { value: n(total - noPrice), label: "With a price" },
    ];
  }

  if (slug === "media") {
    const [all, images, noAlt, sizes] = await Promise.all([
      count(), count({ mimeType: { like: "image/" } }),
      count({ and: [{ mimeType: { like: "image/" } }, { or: [{ alt: { exists: false } }, { alt: { equals: "" } }] }] }),
      apiFind("media", { limit: 2000, where: scope, select: { filesize: true } }),
    ]);
    const bytes = sizes.docs.reduce((sum, d) => sum + (typeof d.filesize === "number" ? d.filesize : 0), 0);
    const mb = bytes / 1048576;
    return [
      { value: n(all), label: "Files" },
      { value: mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`, label: "Total size" },
      { value: n(images), label: "Images" },
      { value: n(noAlt), label: "Images missing alt text" },
    ];
  }

  return null;
}

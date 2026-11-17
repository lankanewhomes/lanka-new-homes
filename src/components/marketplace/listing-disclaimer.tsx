import { T } from "@/components/layout/t";

// Small print at the very bottom of every project and land page (owner, 2026-11-17): when the listing was last updated plus a short, plain
// note about where LankaNewHomes information comes from. Very small, muted text; no heading, no box.
const LAST_UPDATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Colombo" });

export function ListingDisclaimer({ updatedAt }: { updatedAt?: string }) {
  const parsed = updatedAt ? new Date(updatedAt) : null;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? LAST_UPDATE_FORMAT.format(parsed) : "";
  return (
    <aside className="listing-disclaimer" aria-label="About this information">
      {date ? <p className="listing-disclaimer-date"><T>Last update:</T> {date}</p> : null}
      <p>
        <T>LankaNewHomes brings together new homes and land for sale in Sri Lanka. Details come from developers' websites, brochures and adverts, plus our own research, and we check them where we can. Prices, availability and dates can change without notice, so please confirm with the developer before you decide. This page is for reference only.</T>
      </p>
    </aside>
  );
}

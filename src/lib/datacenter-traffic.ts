// Visits that come from a data centre are link-preview fetchers and crawlers, not buyers: Facebook and Instagram load every
// shared link from Prineville, Luleå and Forest City; Google from Council Bluffs, The Dalles and Boardman (Amazon). On 30 Oct 2026
// four of the dashboard's 15 "page views" were these. The towns below are small, so a real buyer is very unlikely to be there.
// Used when an event is saved (is_bot) and again when numbers are read, so past events are cleaned up too.

const DATACENTER_CITIES = new Set([
  "council bluffs", "prineville", "boardman", "the dalles", "luleå", "lulea", "forest city", "altoona", "papillion", "clonee", "eemshaven", "hamina",
]);

/** Is this city one of the data-centre towns that crawlers load pages from? */
export function isDatacenterCity(city: unknown): boolean {
  return typeof city === "string" && DATACENTER_CITIES.has(city.trim().toLowerCase());
}

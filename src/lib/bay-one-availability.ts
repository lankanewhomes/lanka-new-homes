// Live sold / available status of every Bay One apartment, read from the developer's own explorer page
// (https://icclk.com/bayone/public/bay-one), which embeds its unit list as a JS array (DB_APARTMENTS).
// Used by the Apartment Explorer API (live colours) and by the cron that keeps "Units sold / Units available" on the listing current.
const SOURCE = "https://icclk.com/bayone/public/bay-one";
const TTL_MS = 30 * 60 * 1000;
let cache: { at: number; statuses: Record<string, "sold" | "available"> } | null = null;

export async function loadBayOneStatuses(force = false): Promise<{ at: number; statuses: Record<string, "sold" | "available"> }> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache;
  const response = await fetch(SOURCE, { headers: { "user-agent": "Mozilla/5.0 (compatible; LankaNewHomes availability sync)" }, cache: "no-store" });
  if (!response.ok) throw new Error(`source ${response.status}`);
  const html = await response.text();
  const start = html.indexOf("const DB_APARTMENTS = [");
  if (start < 0) throw new Error("unit list not found");
  const open = html.indexOf("[", start);
  let depth = 0;
  let end = -1;
  for (let index = open; index < html.length; index += 1) {
    const char = html[index];
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }
  if (end < 0) throw new Error("unit list not closed");
  const rows = JSON.parse(html.slice(open, end + 1)) as { apartment_no?: string; status?: string }[];
  const statuses: Record<string, "sold" | "available"> = {};
  for (const row of rows) {
    if (!row.apartment_no) continue;
    // "hold", "blocked" and "re-opened" are shown as Available, exactly as the developer's own explorer does.
    statuses[row.apartment_no] = String(row.status ?? "").toLowerCase().trim() === "sold" ? "sold" : "available";
  }
  if (Object.keys(statuses).length < 100) throw new Error("unit list looks incomplete");
  cache = { at: Date.now(), statuses };
  return cache;
}

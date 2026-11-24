// Which keyword pages could we build now? (owner, 2026-11-24: "when I add listings, go and check and find more pages we can rank for")
// Reads the LIVE site (llms.txt = every published project and land plot, sitemap.xml = every page that exists) and lists the towns
// that now have enough listings for a town page we have not built yet. Read-only: it changes nothing.
//   node scripts/seo-page-gaps.mjs            (live site)
//   node scripts/seo-page-gaps.mjs --min 3    (stricter: at least 3 listings)
// Then check the search volume in Ubersuggest (Sri Lanka) before building: docs/owner-rules/seo/seo-workflow.md.
import { readFileSync } from "node:fs";

const SITE = process.env.SITE_URL || "https://www.lankanewhomes.com";
const minArg = process.argv.indexOf("--min");
const MIN = minArg > -1 ? Number(process.argv[minArg + 1]) : 2;

const cities = JSON.parse(readFileSync(new URL("../src/data/cities.json", import.meta.url), "utf8"));
const kebab = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const towns = [...new Set(cities.map((city) => city.name_en.trim()).filter((name) => name.length > 3 && !/^colombo \d/i.test(name)))];

const get = async (path) => {
  const response = await fetch(SITE + path);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
};
const [llms, sitemap] = await Promise.all([get("/llms.txt"), get("/sitemap.xml")]);
const pages = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname));

const lines = llms.split("\n").filter((line) => line.startsWith("- ["));
// Sold-out, sold and completed listings do not justify a new "for sale" page.
const open = (line) => !/, (Sold Out|Sold|Completed)(,| \()/.test(line);
const projects = lines.filter((line) => line.includes("/projects/") && open(line));
const lands = lines.filter((line) => line.includes("/land/") && open(line));
// Count on the location part only (after the link), so a project named after another town is not miscounted.
const where = (line) => line.slice(line.indexOf("): ") + 3);
const count = (list, town) => list.filter((line) => new RegExp(`\\b${town.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(where(line))).length;

const rows = [];
for (const town of towns) {
  const slug = kebab(town);
  const homes = count(projects, town);
  const plots = count(lands, town);
  const hasHomesPage = pages.has(`/projects/houses-for-sale-in-${slug}`) || pages.has(`/projects/apartments-for-sale-in-${slug}`);
  const hasLandPage = pages.has(`/land/land-for-sale-in-${slug}`);
  if (homes >= MIN && !hasHomesPage) rows.push({ town, type: "homes", listings: homes, build: `/projects/houses-for-sale-in-${slug} or apartments-for-sale-in-${slug}` });
  if (plots >= MIN && !hasLandPage) rows.push({ town, type: "land", listings: plots, build: `/land/land-for-sale-in-${slug}` });
}
rows.sort((a, b) => b.listings - a.listings);

console.log(`Live: ${projects.length} open projects, ${lands.length} open land plots, ${pages.size} pages in the sitemap.`);
console.log(`Towns with at least ${MIN} open listings and no town page yet: ${rows.length}\n`);
console.log("| Town | Type | Open listings | Page to build |\n|---|---|---|---|");
for (const row of rows) console.log(`| ${row.town} | ${row.type} | ${row.listings} | ${row.build} |`);

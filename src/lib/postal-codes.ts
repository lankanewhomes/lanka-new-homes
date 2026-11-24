import cities from "@/data/cities.json";
import districts from "@/data/districts.json";
import provinces from "@/data/provinces.json";

// Postal code pages (/postal-codes, /postal-codes/<district>, /postal-codes/<district>/<town>), added 2026-11-24.
// Ubersuggest, Sri Lanka: "<town> postal code" is searched 1,300 to 8,100 times a month for each of the larger towns
// (Colombo 8,100, Kandy 5,400, Dehiwala, Gampaha and Wattala 4,400 each) at difficulty 9 to 14, and the site already showed
// for "nawala zip code" and "bokundara postal code" without having the codes on any page. Every code comes from the same
// Sri Lanka Post town list the listing forms use (src/data/cities.json); nothing here is typed in by hand.

export type PostalTown = {
  slug: string;
  name: string;
  nameSi: string;
  nameTa: string;
  /** Usually one code; a few towns have two post offices (Wattala: 11300 and 11104). */
  codes: string[];
  districtSlug: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
};

export type PostalDistrict = { slug: string; name: string; nameSi: string; nameTa: string; province: string; towns: PostalTown[] };

const kebab = (value: string) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const clean = (value: string | null | undefined) => (value && value !== "NULL" ? value.trim() : "");
/** Names are stored in mixed case ("Colombo Kachcheri", "akkaraipattu"); show each word capitalised. */
const titleCase = (value: string) => value.replace(/\s+/g, " ").trim().replace(/(^|[\s(-])([a-z])/g, (_m, lead: string, letter: string) => lead + letter.toUpperCase());

const provinceById = new Map(provinces.map((province) => [province.id, province.name_en]));

function build(): PostalDistrict[] {
  const result = new Map<string, PostalDistrict>();
  for (const district of districts) {
    result.set(district.id, {
      slug: kebab(district.name_en),
      name: district.name_en,
      nameSi: clean(district.name_si),
      nameTa: clean(district.name_ta),
      province: provinceById.get(district.province_id) ?? "",
      towns: [],
    });
  }
  for (const city of cities) {
    const district = result.get(city.district_id);
    const code = clean(city.postcode);
    const name = titleCase(clean(city.name_en));
    // A Sri Lankan postal code is five digits; rows without one are left out rather than shown blank.
    if (!district || !name || !/^\d{5}$/.test(code)) continue;
    const slug = kebab(name);
    if (!slug) continue;
    const existing = district.towns.find((town) => town.slug === slug);
    if (existing) {
      if (!existing.codes.includes(code)) existing.codes.push(code);
      continue;
    }
    district.towns.push({
      slug,
      name,
      nameSi: clean(city.name_si),
      nameTa: clean(city.name_ta),
      codes: [code],
      districtSlug: district.slug,
      district: district.name,
      province: district.province,
      latitude: Number(city.latitude) || 0,
      longitude: Number(city.longitude) || 0,
    });
  }
  const list = [...result.values()].filter((district) => district.towns.length > 0);
  for (const district of list) {
    for (const town of district.towns) town.codes.sort();
    district.towns.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export const postalDistricts: PostalDistrict[] = build();
export const postalTowns: PostalTown[] = postalDistricts.flatMap((district) => district.towns);

export const postalDistrictPath = (districtSlug: string) => `/postal-codes/${districtSlug}`;
export const postalTownPath = (town: Pick<PostalTown, "districtSlug" | "slug">) => `/postal-codes/${town.districtSlug}/${town.slug}`;

export function getPostalDistrict(slug: string): PostalDistrict | undefined {
  return postalDistricts.find((district) => district.slug === slug);
}

export function getPostalTown(districtSlug: string, townSlug: string): PostalTown | undefined {
  return getPostalDistrict(districtSlug)?.towns.find((town) => town.slug === townSlug);
}

/** "10280", or "11104 and 11300" for the few towns with two post offices. */
export function formatCodes(town: Pick<PostalTown, "codes">): string {
  return town.codes.length <= 1 ? town.codes[0] ?? "" : `${town.codes.slice(0, -1).join(", ")} and ${town.codes[town.codes.length - 1]}`;
}

const toRad = (degrees: number) => (degrees * Math.PI) / 180;

/** Straight-line distance in kilometres between two towns. */
export function distanceKm(a: Pick<PostalTown, "latitude" | "longitude">, b: Pick<PostalTown, "latitude" | "longitude">): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** The closest other towns, nearest first. Towns without coordinates are skipped. */
export function nearestTowns(town: PostalTown, limit = 12): { town: PostalTown; km: number }[] {
  if (!town.latitude || !town.longitude) return [];
  return postalTowns
    .filter((other) => other !== town && other.latitude && other.longitude)
    .map((other) => ({ town: other, km: distanceKm(town, other) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

/** The postal town that matches an area guide (same name; the area's district breaks a tie). */
export function postalTownForArea(area: { name: string; slug?: string; district?: string | null }): PostalTown | undefined {
  const wanted = new Set([kebab(area.name), area.slug ? kebab(area.slug) : ""].filter(Boolean));
  // "Colombo 08" in the area guides is "Colombo 8" in the post office list.
  for (const slug of [...wanted]) wanted.add(slug.replace(/-0+(\d)/g, "-$1"));
  const matches = postalTowns.filter((town) => wanted.has(town.slug));
  if (matches.length <= 1) return matches[0];
  const district = kebab(area.district ?? "");
  return matches.find((town) => town.districtSlug === district) ?? matches[0];
}

/** The best-known towns, for the hub page: the ones people search for most (Ubersuggest, 2026-11-24). */
export const POPULAR_POSTAL_TOWNS: [district: string, town: string][] = [
  ["kandy", "kandy"], ["colombo", "dehiwala"], ["gampaha", "gampaha"], ["gampaha", "wattala"], ["kurunegala", "kurunegala"],
  ["colombo", "piliyandala"], ["colombo", "nugegoda"], ["galle", "galle"], ["colombo", "pannipitiya"], ["kalutara", "panadura"],
  ["colombo", "moratuwa"], ["gampaha", "ragama"], ["colombo", "maharagama"], ["colombo", "malabe"], ["colombo", "rajagiriya"],
  ["colombo", "battaramulla"], ["colombo", "homagama"], ["gampaha", "kadawatha"], ["matara", "matara"], ["colombo", "kaduwela"],
  ["gampaha", "kelaniya"], ["colombo", "boralesgamuwa"], ["colombo", "ratmalana"], ["colombo", "mount-lavinia"],
  ["jaffna", "jaffna"], ["kegalle", "kegalle"], ["colombo", "athurugiriya"], ["gampaha", "minuwangoda"], ["gampaha", "ganemulla"],
  ["anuradhapura", "anuradhapura"], ["matale", "matale"], ["kalutara", "horana"], ["gampaha", "negombo"],
];

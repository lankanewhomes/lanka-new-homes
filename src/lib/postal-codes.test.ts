import { describe, expect, it } from "vitest";
import { POPULAR_POSTAL_TOWNS, formatCodes, getPostalDistrict, getPostalTown, nearestTowns, postalDistricts, postalTownForArea, postalTowns } from "./postal-codes";

describe("postal codes", () => {
  it("covers all 25 districts with five-digit codes only", () => {
    expect(postalDistricts).toHaveLength(25);
    expect(postalTowns.length).toBeGreaterThan(1900);
    for (const town of postalTowns) for (const code of town.codes) expect(code).toMatch(/^\d{5}$/);
  });

  it("has one page per town within a district", () => {
    for (const district of postalDistricts) {
      const slugs = district.towns.map((town) => town.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("knows the well-known codes", () => {
    expect(getPostalTown("colombo", "maharagama")?.codes).toEqual(["10280"]);
    expect(getPostalTown("kandy", "kandy")?.codes).toEqual(["20000"]);
    expect(getPostalTown("colombo", "colombo-3")?.codes).toEqual(["00300"]);
    expect(getPostalDistrict("gampaha")?.province).toBe("Western");
  });

  it("joins the two post offices of one town", () => {
    const wattala = getPostalTown("gampaha", "wattala");
    expect(wattala?.codes).toEqual(["11104", "11300"]);
    expect(formatCodes(wattala!)).toBe("11104 and 11300");
  });

  it("lists the nearest towns first", () => {
    const near = nearestTowns(getPostalTown("colombo", "nugegoda")!, 5);
    expect(near).toHaveLength(5);
    expect(near[0].km).toBeLessThanOrEqual(near[4].km);
    expect(near[4].km).toBeLessThan(10);
  });

  it("matches area guides to their town", () => {
    expect(postalTownForArea({ name: "Colombo 08", slug: "colombo-08", district: "Colombo" })?.codes).toEqual(["00800"]);
    expect(postalTownForArea({ name: "Nawala", district: "Colombo" })?.codes).toEqual(["10106"]);
    expect(postalTownForArea({ name: "No Such Place" })).toBeUndefined();
  });

  it("only promotes towns that exist", () => {
    for (const [district, town] of POPULAR_POSTAL_TOWNS) expect(getPostalTown(district, town), `${district}/${town}`).toBeDefined();
  });
});

import { describe, expect, it } from "vitest";
import { bedroomsMatch, parseNaturalSearch } from "./natural-search";

const cities = ["Colombo", "Kandy", "Mount Lavinia", "Negombo"];

describe("parseNaturalSearch", () => {
  it("understands beds, type, city and a price cap", () => {
    const p = parseNaturalSearch("3 bedroom apartment in Colombo under 50M", cities);
    expect(p).toMatchObject({ minBeds: 3, maxBeds: 3, type: "Apartments", city: "Colombo", maxPriceLkr: 50_000_000, text: "" });
    expect(p.chips).toEqual(["Under Rs. 50M", "3 bedrooms", "Apartments", "Colombo"]);
  });
  it("handles ranges, plus-beds and word numbers", () => {
    expect(parseNaturalSearch("between 20 and 40 million", cities)).toMatchObject({ minPriceLkr: 20_000_000, maxPriceLkr: 40_000_000 });
    const plus = parseNaturalSearch("2+ bed villa Kandy", cities);
    expect(plus).toMatchObject({ minBeds: 2, type: "Villas", city: "Kandy" });
    expect(plus.maxBeds).toBeUndefined();
    expect(parseNaturalSearch("two bedroom flat", cities)).toMatchObject({ minBeds: 2, type: "Apartments" });
  });
  it("detects land and status", () => {
    expect(parseNaturalSearch("land for sale in Negombo", cities)).toMatchObject({ land: true, city: "Negombo" });
    expect(parseNaturalSearch("ready to move condo", cities)).toMatchObject({ status: "Completed", type: "Condominium" });
  });
  it("leaves unrecognised queries untouched", () => {
    const p = parseNaturalSearch("Rajagiriya", cities);
    expect(p.chips).toEqual([]);
    expect(p.text).toBe("Rajagiriya");
  });
  it("keeps leftover place words as text", () => {
    expect(parseNaturalSearch("2 bed Rajagiriya under 30m", cities).text).toBe("rajagiriya");
  });
});

describe("bedroomsMatch", () => {
  it("matches inside ranges, plus-values and floor plans", () => {
    expect(bedroomsMatch({ bedrooms: "1-3" }, 2, 2)).toBe(true);
    expect(bedroomsMatch({ bedrooms: "1-3" }, 4, 4)).toBe(false);
    expect(bedroomsMatch({ bedrooms: "2" }, 3)).toBe(false);
    expect(bedroomsMatch({ bedrooms: "2, 3 & 4" }, 3)).toBe(true);
    expect(bedroomsMatch({ bedrooms: "-", floorPlans: [{ bedrooms: 4 }] }, 3, 3)).toBe(false);
    expect(bedroomsMatch({ bedrooms: "-", floorPlans: [{ bedrooms: 3 }, { bedrooms: 4 }] }, 3, 3)).toBe(true);
    expect(bedroomsMatch({ bedrooms: "-" }, 1)).toBe(false);
    expect(bedroomsMatch({ bedrooms: "-" }, undefined)).toBe(true);
  });
});

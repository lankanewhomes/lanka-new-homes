import { describe, expect, it } from "vitest";
import { matchesFilters } from "./listing-page";
import type { Project } from "@/types";

const land = (over: Partial<Project>) =>
  ({ type: "Residential", status: "Now Selling", startingPriceLkr: 0, priceRange: "", floorAreaRange: "10 perches", ...over }) as Project;

describe("land filters", () => {
  it("matches a multi-use plot on any one of its uses", () => {
    const plot = land({ type: "Residential & Commercial" });
    expect(matchesFilters(plot, { "Land use": "Commercial" })).toBe(true);
    expect(matchesFilters(plot, { "Land use": "Agricultural" })).toBe(false);
  });

  it("matches size ranges by overlap", () => {
    const plot = land({ floorAreaRange: "10 to 25 perches" });
    expect(matchesFilters(plot, { "Any size": "Under 20 perches" })).toBe(true);
    expect(matchesFilters(plot, { "Any size": "20 - 50 perches" })).toBe(true);
    expect(matchesFilters(plot, { "Any size": "50+ perches" })).toBe(false);
  });

  it("does not put a per-perch rate into a total-price bucket", () => {
    const perPerch = land({ startingPriceLkr: 600_000, priceRange: "600,000 per perch" });
    expect(matchesFilters(perPerch, { "Any price": "Under Rs. 10M" })).toBe(false);
    const total = land({ startingPriceLkr: 8_000_000, priceRange: "8,000,000" });
    expect(matchesFilters(total, { "Any price": "Under Rs. 10M" })).toBe(true);
  });
});

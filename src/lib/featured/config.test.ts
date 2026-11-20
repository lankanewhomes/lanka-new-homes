import { describe, expect, it } from "vitest";
import { FOUNDING_PARTNER, TERM_DISCOUNTS, TIERS, priceWithDiscount } from "./config";

describe("discounts", () => {
  it("applies 10 / 15 / 25 percent for 3 / 6 / 12 months", () => {
    expect(TERM_DISCOUNTS.map((term) => term.percent)).toEqual([10, 15, 25]);
    expect(priceWithDiscount(100_000, 1).total).toBe(100_000);
    expect(priceWithDiscount(100_000, 3).total).toBe(270_000);
    expect(priceWithDiscount(100_000, 6).total).toBe(510_000);
    expect(priceWithDiscount(100_000, 12).total).toBe(900_000);
  });
  it("Founding Partner is 50% off the first 6 months", () => {
    expect(FOUNDING_PARTNER.percent).toBe(50);
    expect(priceWithDiscount(60_000, 6, true).total).toBe(180_000);
  });
  it("Founding Partner does not stack with the term discount: the better one wins", () => {
    // 12 months: Founding averages 25% off, the term discount is also 25%, so it is never 25% + 25%.
    expect(priceWithDiscount(100_000, 12, true).total).toBe(900_000);
    // 3 months: Founding (50%) beats the 10% term discount.
    expect(priceWithDiscount(100_000, 3, true).total).toBe(150_000);
    // Without the offer nothing changes.
    expect(priceWithDiscount(100_000, 6, false).total).toBe(510_000);
  });
});

describe("tiers", () => {
  it("has the agreed prices and slots", () => {
    expect(TIERS.featured).toMatchObject({ priceLkrPerMonth: 25_000, projectSlots: 1 });
    expect(TIERS.premium).toMatchObject({ priceLkrPerMonth: 60_000, projectSlots: 3 });
    expect(TIERS.elite).toMatchObject({ priceLkrPerMonth: 120_000, projectSlots: 6 });
  });
});

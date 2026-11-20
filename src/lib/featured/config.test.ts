import { describe, expect, it } from "vitest";
import { FOUNDING_PARTNER, TERM_DISCOUNTS, TIERS, priceWithDiscount } from "./config";

describe("discounts", () => {
  it("applies 10 / 15 / 25 percent for 3 / 6 / 12 months", () => {
    expect(TERM_DISCOUNTS.map((term) => term.percent)).toEqual([10, 15, 25]);
    expect(priceWithDiscount(100_000, 3).total).toBe(270_000);
    expect(priceWithDiscount(100_000, 12).total).toBe(900_000);
  });
  it("Founding Partner is 50% off the first 6 months and does not stack with the term discount", () => {
    expect(FOUNDING_PARTNER.percent).toBe(50);
    const six = priceWithDiscount(60_000, 6, ).total;
    expect(six).toBe(60_000 * 6 * 0.85); // plain term discount for 6 months
  });
});

describe("tiers", () => {
  it("has the agreed prices and slots", () => {
    expect(TIERS.featured).toMatchObject({ priceLkrPerMonth: 25_000, projectSlots: 1 });
    expect(TIERS.premium).toMatchObject({ priceLkrPerMonth: 60_000, projectSlots: 3 });
    expect(TIERS.elite).toMatchObject({ priceLkrPerMonth: 120_000, projectSlots: 6 });
  });
});

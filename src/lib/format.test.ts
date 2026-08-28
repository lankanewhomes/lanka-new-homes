import { describe, expect, it } from "vitest";
import { compactLkr, formatLkr } from "./format";

describe("formatLkr", () => {
  it("formats a number with the Rs. prefix and locale grouping", () => {
    expect(formatLkr(1500000)).toBe("Rs. 1,500,000");
  });
});

describe("compactLkr", () => {
  it("compacts millions to an M suffix", () => {
    expect(compactLkr(2500000)).toBe("Rs. 2.5M");
  });

  it("compacts whole millions without decimals", () => {
    expect(compactLkr(3000000)).toBe("Rs. 3M");
  });

  it("falls back to formatLkr under one million", () => {
    expect(compactLkr(999999)).toBe("Rs. 999,999");
  });
});

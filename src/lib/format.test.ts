import { describe, expect, it } from "vitest";
import { compactLkr, formatLkr, splitSentences } from "./format";

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

describe("splitSentences", () => {
  it("puts each sentence on its own line without breaking on Rs.", () => {
    expect(
      splitSentences(
        "2-Bedroom from Rs. 91,270,000. 3-Bedroom from Rs. 117,612,000. Junior Penthouse, 4/5-Bedroom, and 5-Bedroom Penthouse units are sold out.",
      ),
    ).toEqual([
      "2-Bedroom from Rs. 91,270,000.",
      "3-Bedroom from Rs. 117,612,000.",
      "Junior Penthouse, 4/5-Bedroom, and 5-Bedroom Penthouse units are sold out.",
    ]);
  });

  it("leaves a single sentence and decimals alone", () => {
    expect(splitSentences("From Rs. 2.5M per unit upwards")).toEqual(["From Rs. 2.5M per unit upwards"]);
  });

  it("splits on line breaks and drops empty values", () => {
    expect(splitSentences("Tower A: Rs. 50M\nTower B: Rs. 60M")).toEqual(["Tower A: Rs. 50M", "Tower B: Rs. 60M"]);
    expect(splitSentences(undefined)).toEqual([]);
  });
});

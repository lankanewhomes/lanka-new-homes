import { describe, expect, it } from "vitest";
import { areaDescription, areaTitle, type AreaMetaInput } from "./area-meta";

const base: AreaMetaInput = { name: "Meegoda", city: "Meegoda", district: "Colombo District", homeCount: 0, plotCount: 4, lowestPerPerch: 450000, lowestHomePrice: 0, intro: "Meegoda is a town in the Homagama division. It sits on the Colombo-Awissawella road." };

describe("areaTitle", () => {
  it("names the district and the plots", () => {
    expect(areaTitle(base)).toBe("Houses & Land for Sale in Meegoda, Colombo District: 4 Land Plots");
  });
  it("never repeats the name when the city equals it", () => {
    expect(areaTitle({ ...base, district: undefined })).toBe("Houses & Land for Sale in Meegoda: 4 Land Plots");
  });
  it("lists homes and plots together, and falls back to a guide when there is nothing", () => {
    expect(areaTitle({ ...base, homeCount: 1 })).toContain("1 New Home & 4 Land Plots");
    expect(areaTitle({ ...base, plotCount: 0 })).toBe("Houses & Land for Sale in Meegoda, Colombo District: Prices & Area Guide");
  });
});

describe("areaDescription", () => {
  it("opens with the district and the lowest price", () => {
    const text = areaDescription(base);
    expect(text.startsWith("Meegoda is in Colombo District. 4 land plots from Rs. 450,000 per perch")).toBe(true);
    expect(text.length).toBeLessThanOrEqual(160);
  });
  it("never ends mid-word with the intro cut", () => {
    expect(areaDescription({ ...base, intro: "x".repeat(400) }, 160).length).toBeLessThanOrEqual(161);
  });
});

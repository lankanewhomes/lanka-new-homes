import { describe, expect, it } from "vitest";
import { dailyPick, rotationSeed, seededShuffle } from "./daily-rotation";

describe("daily rotation", () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ id: i, dev: i < 20 ? "big" : `small-${i}` }));

  it("uses the Sri Lanka date", () => {
    expect(rotationSeed(new Date("2026-10-21T18:29:00Z"))).toBe("2026-10-21");
    expect(rotationSeed(new Date("2026-10-21T18:31:00Z"))).toBe("2026-10-22");
  });

  it("gives the same order for the same day and a different one the next day", () => {
    expect(seededShuffle(items, "2026-10-21")).toEqual(seededShuffle(items, "2026-10-21"));
    expect(seededShuffle(items, "2026-10-21")).not.toEqual(seededShuffle(items, "2026-10-22"));
  });

  it("shows everything, unshuffled, when there are no more than the shelf holds", () => {
    expect(dailyPick(items.slice(0, 5), 8, "x")).toEqual(items.slice(0, 5));
  });

  it("returns the requested count of distinct items", () => {
    const picked = dailyPick(items, 8, "2026-10-21");
    expect(picked).toHaveLength(8);
    expect(new Set(picked.map((i) => i.id)).size).toBe(8);
  });

  it("caps one group, and back-fills when there are too few groups", () => {
    const capped = dailyPick(items, 8, "2026-10-21", { groupOf: (i) => i.dev, maxPerGroup: 2 });
    expect(capped.filter((i) => i.dev === "big").length).toBeLessThanOrEqual(2);
    const onlyBig = items.slice(0, 20);
    expect(dailyPick(onlyBig, 8, "2026-10-21", { groupOf: (i) => i.dev, maxPerGroup: 2 })).toHaveLength(8);
  });
});

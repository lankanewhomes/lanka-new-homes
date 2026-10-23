import { describe, expect, it } from "vitest";
import { keepRowsWhenWipedBy } from "./protect-arrays";

describe("keepRowsWhenWipedBy", () => {
  const previous = { slug: "x", gallery: [{ image: "a" }], floorPlans: [{ planName: "A" }], nearby: [] };
  it("keeps stored rows when a save submits an empty list", () => {
    const { data, kept } = keepRowsWhenWipedBy({ gallery: [], summary: "new" }, previous, ["gallery", "floorPlans", "nearby"]);
    expect(data.gallery).toEqual(previous.gallery);
    expect(data.summary).toBe("new");
    expect(kept).toEqual(["gallery(1)"]);
  });
  it("leaves lists alone when they are not part of the save, or are not empty", () => {
    expect(keepRowsWhenWipedBy({ summary: "y" }, previous, ["gallery"]).kept).toEqual([]);
    expect(keepRowsWhenWipedBy({ gallery: [{ image: "b" }] }, previous, ["gallery"]).data.gallery).toEqual([{ image: "b" }]);
  });
  it("allows an empty list when there was nothing stored", () => {
    expect(keepRowsWhenWipedBy({ nearby: [] }, previous, ["nearby"]).kept).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { ANALYTICS_START, fromAnalyticsStart } from "./analytics-start";

describe("fromAnalyticsStart", () => {
  it("never reaches back before the fresh-start moment", () => {
    expect(fromAnalyticsStart("2026-09-01T00:00:00.000Z")).toBe(ANALYTICS_START);
    expect(fromAnalyticsStart("2026-12-01T00:00:00.000Z")).toBe("2026-12-01T00:00:00.000Z");
  });
});

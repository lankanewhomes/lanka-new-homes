import { describe, expect, it } from "vitest";
import { addDays, dayEndIso, dayKey, dayStartIso, timeOf } from "./analytics-time";
import { isDatacenterCity } from "./datacenter-traffic";

describe("analytics clock (Sri Lanka time)", () => {
  it("puts 20:00 UTC on the next Sri Lanka day", () => {
    expect(dayKey("2026-10-30T20:00:00Z")).toBe("2026-10-31");
    expect(dayKey("2026-10-30T18:29:00Z")).toBe("2026-10-30");
  });
  it("starts and ends a day at Sri Lanka midnight", () => {
    expect(dayStartIso("2026-10-31")).toBe("2026-10-30T18:30:00.000Z");
    expect(dayEndIso("2026-10-31")).toBe("2026-10-31T18:29:59.999Z");
  });
  it("moves days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", -2)).toBe("2026-10-30");
  });
  it("shows the time of a view in Sri Lanka time", () => {
    expect(timeOf("2026-10-30T18:30:00Z")).toBe("12:00 am");
    expect(timeOf("2026-10-30T16:11:00Z")).toBe("9:41 pm");
  });
});

describe("data-centre traffic", () => {
  it("flags the crawler towns and leaves real cities alone", () => {
    expect(isDatacenterCity("Council Bluffs")).toBe(true);
    expect(isDatacenterCity("Luleå")).toBe(true);
    expect(isDatacenterCity("Colombo")).toBe(false);
    expect(isDatacenterCity(undefined)).toBe(false);
  });
});

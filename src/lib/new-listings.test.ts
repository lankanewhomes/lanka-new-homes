import { describe, expect, it } from "vitest";
import { isInNewListingsWindow, NEW_LISTINGS_WINDOW_DAYS, newListingsCutoff, resolvePublishedAt, wentLiveAt } from "./new-listings";

const NOW = new Date("2026-09-26T12:00:00.000Z");

describe("newListingsCutoff", () => {
  it("is 30 days before now", () => {
    expect(NEW_LISTINGS_WINDOW_DAYS).toBe(30);
    expect(newListingsCutoff(NOW)).toBe("2026-08-27T12:00:00.000Z");
  });
});

describe("isInNewListingsWindow", () => {
  const cutoff = newListingsCutoff(NOW);

  it("includes a listing that went live inside the window, excludes one outside it", () => {
    expect(isInNewListingsWindow({ publishedAt: "2026-09-20T08:00:00+00:00" }, cutoff)).toBe(true);
    expect(isInNewListingsWindow({ publishedAt: "2026-08-01T08:00:00+00:00" }, cutoff)).toBe(false);
  });

  it("counts the boundary itself as inside", () => {
    expect(isInNewListingsWindow({ createdAt: "2026-08-27T12:00:00.000Z" }, cutoff)).toBe(true);
    expect(isInNewListingsWindow({ createdAt: "2026-08-27T11:59:59.000Z" }, cutoff)).toBe(false);
  });

  it("prefers publishedAt over createdAt (imported as a draft, published later)", () => {
    expect(isInNewListingsWindow({ createdAt: "2026-08-01T00:00:00Z", publishedAt: "2026-09-20T00:00:00Z" }, cutoff)).toBe(true);
    expect(wentLiveAt({ createdAt: "2026-08-01T00:00:00Z", publishedAt: "2026-09-20T00:00:00Z" })).toBe("2026-09-20T00:00:00Z");
  });

  it("falls back to createdAt, and treats a missing/invalid date as not new", () => {
    expect(isInNewListingsWindow({ createdAt: "2026-09-10T00:00:00Z" }, cutoff)).toBe(true);
    expect(isInNewListingsWindow({}, cutoff)).toBe(false);
    expect(isInNewListingsWindow({ createdAt: "not a date" }, cutoff)).toBe(false);
  });
});

describe("resolvePublishedAt", () => {
  const nowIso = NOW.toISOString();

  it("keeps an existing stamp forever", () => {
    expect(resolvePublishedAt({ isPublishedNow: true, existing: { publishedAt: "2026-09-01T00:00:00Z", wasLive: true }, nowIso })).toBe("2026-09-01T00:00:00Z");
    expect(resolvePublishedAt({ isPublishedNow: false, existing: { publishedAt: "2026-09-01T00:00:00Z", wasLive: true }, nowIso })).toBe("2026-09-01T00:00:00Z");
  });

  it("stamps nothing for a draft", () => {
    expect(resolvePublishedAt({ isPublishedNow: false, existing: null, nowIso })).toBeUndefined();
    expect(resolvePublishedAt({ isPublishedNow: false, existing: { wasLive: false }, nowIso })).toBeUndefined();
  });

  it("stamps now on first publish (new row, or a draft going live)", () => {
    expect(resolvePublishedAt({ isPublishedNow: true, existing: null, nowIso })).toBe(nowIso);
    expect(resolvePublishedAt({ isPublishedNow: true, existing: { wasLive: false, createdAt: "2026-08-01T00:00:00Z" }, nowIso })).toBe(nowIso);
  });

  it("does not make an already-live legacy listing new again when it is edited", () => {
    expect(resolvePublishedAt({ isPublishedNow: true, existing: { wasLive: true, createdAt: "2026-07-15T00:00:00Z" }, nowIso })).toBe("2026-07-15T00:00:00Z");
  });
});

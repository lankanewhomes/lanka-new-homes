import { afterEach, describe, expect, it, vi } from "vitest";
import { createEventId, maskPersonalData, trackEvent } from "./metaPixel";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function browserWithPixel(fbq: unknown, cookie = "") {
  vi.stubGlobal("window", { fbq });
  vi.stubGlobal("document", { cookie });
  vi.stubGlobal("navigator", { webdriver: false, userAgent: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1" });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createEventId", () => {
  it("returns a new v4 UUID each time", () => {
    const first = createEventId();
    expect(first).toMatch(UUID_V4);
    expect(createEventId()).not.toBe(first);
  });

  it("still returns a v4 UUID without crypto.randomUUID", () => {
    vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => bytes.fill(7) });
    expect(createEventId()).toMatch(UUID_V4);
  });
});

describe("trackEvent", () => {
  it("does nothing on the server but still returns an event id", () => {
    expect(trackEvent("Lead", { lead_type: "form", content_name: "the-one", content_category: "project" })).toMatch(UUID_V4);
  });

  it("sends a standard event with its eventID, reusing a given id", () => {
    const fbq = vi.fn();
    browserWithPixel(fbq);
    const id = trackEvent("Contact", { method: "whatsapp", content_name: "the-one", content_category: "project" }, "id-123");
    expect(id).toBe("id-123");
    expect(fbq).toHaveBeenCalledWith("track", "Contact", { method: "whatsapp", content_name: "the-one", content_category: "project" }, { eventID: "id-123" });
  });

  it("creates an id when none is given", () => {
    const fbq = vi.fn();
    browserWithPixel(fbq);
    const id = trackEvent("ViewContent", { content_name: "the-one", content_category: "project", value: 52_000_000, currency: "LKR" });
    expect(id).toMatch(UUID_V4);
    expect(fbq.mock.calls[0][3]).toEqual({ eventID: id });
  });

  it("sends non-standard events with trackCustom", () => {
    const fbq = vi.fn();
    browserWithPixel(fbq);
    trackEvent("FollowDeveloper", { content_name: "prime-lands", content_category: "developer" });
    expect(fbq.mock.calls[0][0]).toBe("trackCustom");
  });

  it("masks emails and phone numbers typed into the search box", () => {
    const fbq = vi.fn();
    browserWithPixel(fbq);
    trackEvent("Search", { search_string: "call me 077 123 4567 or me@example.com", content_category: "project" });
    expect(fbq.mock.calls[0][2]).toEqual({ search_string: "call me [number] or [email]", content_category: "project" });
  });

  it("sends nothing from the owner's own browser", () => {
    const fbq = vi.fn();
    browserWithPixel(fbq, "lnh_internal=1");
    trackEvent("Lead", { lead_type: "brochure", content_name: "the-one", content_category: "project" });
    expect(fbq).not.toHaveBeenCalled();
  });

  it("never throws when the pixel is missing or throws", () => {
    browserWithPixel(undefined);
    expect(() => trackEvent("PageView", {})).not.toThrow();
    browserWithPixel(() => {
      throw new Error("blocked");
    });
    expect(() => trackEvent("CompleteRegistration", { content_name: "user" })).not.toThrow();
  });
});

describe("maskPersonalData", () => {
  it("keeps ordinary property searches as typed", () => {
    for (const text of ["2 bed in Colombo under 50M", "Any price: Rs. 30M - 60M", "City: Negombo | Move-in: 2027", "under 150,000,000"]) {
      expect(maskPersonalData(text)).toBe(text);
    }
  });

  it("masks phone numbers in the usual shapes", () => {
    expect(maskPersonalData("0771234567")).toBe("[number]");
    expect(maskPersonalData("+94 77 123 4567")).toBe("[number]");
    expect(maskPersonalData("(077) 123-4567 Kandy")).toBe("[number] Kandy");
  });
});

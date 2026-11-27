import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanSearchString, newMetaEventId, pageContentCategory, trackCustomEvent, trackEvent } from "./metaPixel";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("metaPixel", () => {
  it("does nothing on the server and still returns an event id", () => {
    expect(trackEvent("Lead", { lead_type: "form", content_name: "some-project", content_category: "project" })).toMatch(UUID);
  });

  it("does nothing when the pixel is not on the page", () => {
    vi.stubGlobal("window", { location: { pathname: "/" } });
    expect(() => trackEvent("PageView")).not.toThrow();
  });

  it("sends the event with a new event id", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq, location: { pathname: "/" } });
    const id = trackEvent("Contact", { method: "whatsapp", content_name: "some-project", content_category: "project" });
    expect(id).toMatch(UUID);
    expect(fbq).toHaveBeenCalledWith("track", "Contact", { method: "whatsapp", content_name: "some-project", content_category: "project" }, { eventID: id });
  });

  it("uses the event id it is given", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq, location: { pathname: "/" } });
    expect(trackEvent("Lead", { lead_type: "brochure", content_name: "p", content_category: "land" }, "lead-123")).toBe("lead-123");
    expect(fbq).toHaveBeenCalledWith("track", "Lead", expect.any(Object), { eventID: "lead-123" });
  });

  it("sends custom events with trackCustom", () => {
    const fbq = vi.fn();
    vi.stubGlobal("window", { fbq, location: { pathname: "/" } });
    trackCustomEvent("DownloadBrochure", { content_name: "p" });
    expect(fbq).toHaveBeenCalledWith("trackCustom", "DownloadBrochure", { content_name: "p" }, { eventID: expect.stringMatching(UUID) });
  });

  it("never throws when the pixel throws", () => {
    vi.stubGlobal("window", { fbq: () => { throw new Error("blocked"); }, location: { pathname: "/" } });
    expect(() => trackEvent("PageView")).not.toThrow();
  });

  it("makes a different id each time", () => {
    expect(newMetaEventId()).not.toBe(newMetaEventId());
  });

  it("names the page category from the address", () => {
    expect(pageContentCategory("/projects/some-project")).toBe("project");
    expect(pageContentCategory("/land/some-plot")).toBe("land");
    expect(pageContentCategory("/developers/some-developer")).toBe("developer");
    expect(pageContentCategory("/construction-companies/some-company")).toBe("construction_company");
    expect(pageContentCategory("/")).toBe("project");
  });

  it("takes emails and phone numbers out of search text", () => {
    expect(cleanSearchString("villa in galle")).toBe("villa in galle");
    expect(cleanSearchString("call me someone@example.com about colombo 7")).toBe("call me about colombo 7");
    expect(cleanSearchString("apartments +94 77 123 4567")).toBe("apartments");
  });
});

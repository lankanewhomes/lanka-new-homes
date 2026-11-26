import { describe, expect, it } from "vitest";
import type { Project } from "@/types";
import { MAX_PINNED_PER_PAGE } from "./config";
import { eliteHeroPackages, matchesLocation, matchesType, orderFeatured, rotateFairly, selectFeatured, websiteLinkFor, websiteUrl } from "./engine";
import type { FeaturedItem, FeaturedState } from "./types";

const NOW = new Date("2026-11-20T10:00:00Z");
const project = (slug: string, developerSlug: string, over: Partial<Project> = {}) =>
  ({ slug, name: slug, developerSlug, developerName: developerSlug, location: "Rajagiriya", city: "Colombo", district: "Colombo", neighborhood: "", type: "Apartments", isPublished: true, ...over }) as Project;

const projects = [
  project("a1", "a"), project("a2", "a"), project("a3", "a"),
  project("b1", "b"), project("c1", "c", { city: "Kandy", location: "Kandy", district: "Kandy" }),
  project("d1", "d", { type: "Villas" }), project("e1", "e"),
];
const pkg = (id: string, developerSlug: string, tier: "featured" | "premium" | "elite", slugs: string[], over = {}) => ({ id, developerSlug, tier, startDate: "2026-11-01", endDate: "2026-11-30", slots: slugs.length, projectSlugs: slugs, ...over });
const state = (packages: FeaturedState["packages"]): FeaturedState => ({ packages, bookings: [], demo: false });

describe("matching", () => {
  it("matches a place by location, city or district, not by substring of another word", () => {
    expect(matchesLocation(projects[0], "Colombo")).toBe(true);
    expect(matchesLocation(projects[0], "Rajagiriya")).toBe(true);
    expect(matchesLocation(projects[4], "Colombo")).toBe(false);
    expect(matchesLocation(project("x", "x", { location: "Colombo 5", city: "Colombo" }), "Colombo")).toBe(true);
  });
  it("treats apartments and condominiums as the same buyer intent but not villas", () => {
    expect(matchesType(project("x", "x", { type: "Condominium" }), "Apartments")).toBe(true);
    expect(matchesType(project("x", "x", { type: "Villas" }), "Apartments")).toBe(false);
  });
});

describe("selectFeatured", () => {
  const s = state([pkg("p1", "a", "featured", ["a1"]), pkg("p2", "b", "premium", ["b1"]), pkg("p3", "e", "elite", ["e1"]), pkg("p4", "c", "premium", ["c1"]), pkg("p5", "d", "premium", ["d1"])]);

  it("orders elite, then premium, then featured", () => {
    const out = selectFeatured(s, projects, "results-inline", { location: "Colombo", now: NOW }).map((i) => i.tier);
    expect(out).toEqual(["elite", "premium", "premium", "featured"]);
  });
  it("only shows projects that match the page", () => {
    const slugs = selectFeatured(s, projects, "results-inline", { location: "Colombo", type: "Apartments", now: NOW }).map((i) => i.project.slug);
    expect(slugs).not.toContain("c1");
    expect(slugs).not.toContain("d1");
  });
  it("gates placements by tier: a Featured package cannot be pinned at the top", () => {
    const slugs = selectFeatured(s, projects, "results-top", { location: "Colombo", now: NOW }).map((i) => i.project.slug);
    expect(slugs).not.toContain("a1");
    expect(slugs).toContain("b1");
  });
  it("caps pinned results at 3", () => {
    const many = state([pkg("p", "a", "elite", ["a1", "a2", "a3"]), pkg("q", "b", "premium", ["b1"]), pkg("r", "e", "premium", ["e1"])]);
    expect(selectFeatured(many, projects, "results-top", { now: NOW, limit: 10 }).length).toBe(MAX_PINNED_PER_PAGE);
  });
  it("ignores expired and not-yet-started packages", () => {
    const old = state([pkg("p", "a", "elite", ["a1"], { endDate: "2026-10-31" }), pkg("q", "b", "elite", ["b1"], { startDate: "2026-12-01" })]);
    expect(selectFeatured(old, projects, "results-inline", { now: NOW })).toEqual([]);
  });
  it("only fills as many slots as the package has", () => {
    const one = state([pkg("p", "a", "featured", ["a1", "a2"], { slots: 1 })]);
    expect(selectFeatured(one, projects, "results-inline", { now: NOW }).map((i) => i.project.slug)).toEqual(["a1"]);
  });
  it("never lists the page's own project", () => {
    expect(selectFeatured(s, projects, "project-similar", { now: NOW, projectSlug: "e1" }).map((i) => i.project.slug)).not.toContain("e1");
  });
  it("makes an Elite developer's own pages competitor-free", () => {
    const out = selectFeatured(s, projects, "project-similar", { now: NOW, projectSlug: "e1", developerSlug: "e" });
    expect(out).toEqual([]);
    const own = state([pkg("p", "e", "elite", ["e1", "a1"]), pkg("q", "b", "premium", ["b1"])]);
    expect(selectFeatured(own, projects, "project-similar", { now: NOW, projectSlug: "e1", developerSlug: "e" }).every((i) => i.developerSlug === "e")).toBe(true);
  });
  it("returns nothing when nothing is booked, so the slot renders nothing", () => {
    expect(selectFeatured(state([]), projects, "results-top", { now: NOW })).toEqual([]);
  });
});

describe("rotation", () => {
  const items: FeaturedItem[] = ["a1", "a2", "a3", "b1", "e1"].map((slug) => {
    const p = projects.find((x) => x.slug === slug)!;
    return { project: p, tier: "premium", packageId: p.developerSlug, developerSlug: p.developerSlug };
  });
  it("lets every developer take a turn before any developer gets a second spot", () => {
    const first3 = rotateFairly(items, 0).slice(0, 3).map((i) => i.developerSlug);
    expect(new Set(first3).size).toBe(3);
  });
  it("gives each developer the first place over time", () => {
    const firsts = new Set([0, 1, 2].map((bucket) => rotateFairly(items, bucket)[0].developerSlug));
    expect(firsts.size).toBe(3);
  });
  it("is stable for the same hour", () => {
    expect(orderFeatured(items, NOW, "x").map((i) => i.project.slug)).toEqual(orderFeatured(items, NOW, "x").map((i) => i.project.slug));
  });
});

describe("elite hero week", () => {
  it("an elite package is on the hero in exactly one week of the month", () => {
    const s = state([pkg("elite-1", "a", "elite", ["a1"])]);
    const weeks = [1, 8, 15, 22].filter((day) => eliteHeroPackages(s, new Date(Date.UTC(2026, 10, day))).length === 1);
    expect(weeks.length).toBe(1);
  });
});

describe("website link add-on", () => {
  const now = new Date(Date.UTC(2026, 10, 15));
  const link = (developerSlug: string, href: string, over: Partial<FeaturedState["bookings"][number]> = {}): FeaturedState["bookings"][number] =>
    ({ id: `add-${developerSlug}-${href}`, type: "website-link", developerSlug, startDate: "2026-11-01", endDate: "2026-11-30", creative: { image: "", headline: "", ctaHref: href }, ...over });
  const withBookings = (bookings: FeaturedState["bookings"]): FeaturedState => ({ packages: [], bookings, demo: false });

  it("no booking, no website", () => {
    expect(websiteLinkFor(withBookings([]), "a", "a1", now)).toBeUndefined();
  });
  it("a booking without a project covers every project of that developer only", () => {
    const s = withBookings([link("a", "https://a.example/")]);
    expect(websiteLinkFor(s, "a", "a1", now)).toBe("https://a.example/");
    expect(websiteLinkFor(s, "a", "a2", now)).toBe("https://a.example/");
    expect(websiteLinkFor(s, "b", "b1", now)).toBeUndefined();
  });
  it("a booking for one project wins for that project and does not cover the others", () => {
    const s = withBookings([link("a", "https://a.example/one", { projectSlug: "a1" })]);
    expect(websiteLinkFor(s, "a", "a1", now)).toBe("https://a.example/one");
    expect(websiteLinkFor(s, "a", "a2", now)).toBeUndefined();
  });
  it("an ended booking and a link that is not a web address give nothing", () => {
    expect(websiteLinkFor(withBookings([link("a", "https://a.example/", { endDate: "2026-11-10" })]), "a", "a1", now)).toBeUndefined();
    expect(websiteLinkFor(withBookings([link("a", "javascript:alert(1)")]), "a", "a1", now)).toBeUndefined();
    expect(websiteUrl("/projects/x")).toBeUndefined();
  });
});

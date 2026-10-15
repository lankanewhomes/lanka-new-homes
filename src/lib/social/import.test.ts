import { describe, expect, it } from "vitest";
import { mapFacebookPost, mapFacebookVideo, mapInstagramMedia, matchProject } from "./import";

const projects = [
  { id: 96, name: "The Golf - Colombo 08", slug: "the-golf-colombo-08" },
  { id: 98, name: "The Seasons - Colombo 08", slug: "the-seasons-colombo-08" },
  { id: 95, name: "Mon Vie - Colombo 05", slug: "mon-vie-colombo-05" },
  { id: 90, name: "J'Adore Negombo", slug: "j-adore-negombo" },
  { id: 10, name: "Golf View Residencies", slug: "golf-view-residencies" },
  { id: 20, name: "Rush Court 4 Mount Lavinia", slug: "rush-court-4-mount-lavinia" },
  { id: 21, name: "Rush Court 6 Mount Lavinia", slug: "rush-court-6-mount-lavinia" },
];

describe("matchProject", () => {
  it("trusts a lankanewhomes.com link above everything", () => {
    const m = matchProject("Mon Vie is lovely but see https://www.lankanewhomes.com/projects/the-golf-colombo-08 now", projects);
    expect(m).toMatchObject({ by: "link", project: { id: 96 } });
  });
  it("matches the full name and its short head as whole words", () => {
    expect(matchProject("New: The Golf Colombo 08 by Prime Residencies. Rooftop pool and golf views.", projects)).toMatchObject({ by: "name", project: { id: 96 } });
    expect(matchProject("Weekend at The Golf - private plunge pools", projects)?.project.id).toBe(96);
    expect(matchProject("Mon Vie, Colombo 05, now selling", projects)?.project.id).toBe(95);
  });
  it("matches names with punctuation and accents", () => {
    expect(matchProject("J’Adore Negombo launch weekend", projects)?.project.id).toBe(90);
    expect(matchProject("Visit J'Adore Negombo", projects)?.project.id).toBe(90);
  });
  it("matches a hashtag made of the name", () => {
    expect(matchProject("Dream big #TheSeasonsColombo08 #luxuryliving", projects)).toMatchObject({ by: "hashtag", project: { id: 98 } });
  });
  it("does not guess: generic words, other cities and ties stay unmatched", () => {
    expect(matchProject("Beautiful apartments in Colombo 08 with golf views", projects)).toBeNull();
    expect(matchProject("Rush Court is selling fast", projects)).toBeNull();
    expect(matchProject("", projects)).toBeNull();
    expect(matchProject("Happy new year from LankaNewHomes!", projects)).toBeNull();
  });
  it("picks the longest name when two listings share words", () => {
    expect(matchProject("Rush Court 4 Mount Lavinia open day", projects)?.project.id).toBe(20);
    expect(matchProject("Golf View Residencies tour", projects)?.project.id).toBe(10);
  });
});

describe("mapping Graph responses", () => {
  it("maps Instagram posts, reels, carousels, videos and stories", () => {
    expect(mapInstagramMedia({ id: "1", media_type: "IMAGE", media_url: "u", permalink: "p", timestamp: "t", like_count: 4 })).toMatchObject({ platform: "instagram", kind: "photo", thumbnailUrl: "u", likes: 4 });
    expect(mapInstagramMedia({ id: "2", media_type: "VIDEO", media_product_type: "REELS", thumbnail_url: "th" }).kind).toBe("reel");
    expect(mapInstagramMedia({ id: "3", media_type: "CAROUSEL_ALBUM" }).kind).toBe("carousel");
    expect(mapInstagramMedia({ id: "4", media_type: "VIDEO" }).kind).toBe("video");
    expect(mapInstagramMedia({ id: "5", media_type: "IMAGE" }, true).kind).toBe("story");
  });
  it("maps Facebook posts and videos", () => {
    expect(mapFacebookPost({ id: "9_1", message: "hi", created_time: "t", attachments: { data: [{ media_type: "video" }] } }).kind).toBe("video");
    expect(mapFacebookPost({ id: "9_2", attachments: { data: [{ media_type: "album", subattachments: { data: [{}, {}] } }] } }).kind).toBe("carousel");
    expect(mapFacebookPost({ id: "9_3", full_picture: "x" })).toMatchObject({ kind: "photo", thumbnailUrl: "x", permalink: "https://www.facebook.com/9_3" });
    expect(mapFacebookVideo({ id: "7", title: "Tour", description: "The Golf", permalink_url: "/lankanewhomes/videos/7/" })).toMatchObject({ kind: "video", caption: "Tour\nThe Golf", permalink: "https://www.facebook.com/lankanewhomes/videos/7/" });
  });
});

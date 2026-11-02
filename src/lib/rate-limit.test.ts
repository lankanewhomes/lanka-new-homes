import { beforeEach, describe, expect, it } from "vitest";
import { allowHit, clientIp, rateLimited, resetRateLimits } from "./rate-limit";

beforeEach(resetRateLimits);

describe("allowHit", () => {
  it("allows up to the limit then blocks", () => {
    expect([1, 2, 3, 4].map(() => allowHit("a", 3, 1000, 0))).toEqual([true, true, true, false]);
  });
  it("starts a fresh window after it ends", () => {
    for (let i = 0; i < 4; i++) allowHit("a", 3, 1000, 0);
    expect(allowHit("a", 3, 1000, 1001)).toBe(true);
  });
  it("counts each visitor separately", () => {
    for (let i = 0; i < 4; i++) allowHit("a", 3, 1000, 0);
    expect(allowHit("b", 3, 1000, 0)).toBe(true);
  });
});

describe("rateLimited", () => {
  const req = (ip: string) => new Request("https://x.test/api/contact", { headers: { "cf-connecting-ip": ip } });
  it("returns a 429 with Retry-After once over the limit", async () => {
    expect(rateLimited(req("1.1.1.1"), "t", 1, 60000)).toBeNull();
    const res = rateLimited(req("1.1.1.1"), "t", 1, 60000);
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBe("60");
  });
  it("reads the Cloudflare IP first, then x-forwarded-for", () => {
    expect(clientIp(req("9.9.9.9"))).toBe("9.9.9.9");
    expect(clientIp(new Request("https://x.test", { headers: { "x-forwarded-for": "8.8.8.8, 1.1.1.1" } }))).toBe("8.8.8.8");
  });
  it("never limits search engines, social previews or AI assistants", () => {
    const bot = (ua: string) => new Request("https://x.test/api/leads", { headers: { "cf-connecting-ip": "5.5.5.5", "user-agent": ua } });
    for (const ua of ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "Mozilla/5.0 (compatible; GPTBot/1.1)", "facebookexternalhit/1.1", "Mozilla/5.0 (compatible; bingbot/2.0)"]) {
      for (let i = 0; i < 50; i++) expect(rateLimited(bot(ua), "bot-test", 1, 60000)).toBeNull();
    }
  });
  it("still limits an ordinary visitor", () => {
    const person = new Request("https://x.test/api/leads", { headers: { "cf-connecting-ip": "6.6.6.6", "user-agent": "Mozilla/5.0 Chrome/124 Safari/537.36" } });
    expect(rateLimited(person, "person-test", 1, 60000)).toBeNull();
    expect(rateLimited(person, "person-test", 1, 60000)?.status).toBe(429);
  });
});

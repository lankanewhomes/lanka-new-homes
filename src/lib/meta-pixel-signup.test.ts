import { afterEach, describe, expect, it, vi } from "vitest";
import { isFreshOAuthSignup, takeNewSignupCookie } from "./meta-pixel-signup";

const NOW = Date.parse("2026-11-26T10:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isFreshOAuthSignup", () => {
  it("is true for a Google account created seconds ago, signing in for the first time", () => {
    expect(isFreshOAuthSignup({ created_at: ago(5_000), last_sign_in_at: ago(2_000), app_metadata: { provider: "google" } }, NOW)).toBe(true);
    expect(isFreshOAuthSignup({ created_at: ago(5_000), last_sign_in_at: null, app_metadata: { provider: "google" } }, NOW)).toBe(true);
  });

  it("is false for email sign-ups (their form already sent the event) and for missing data", () => {
    expect(isFreshOAuthSignup({ created_at: ago(5_000), last_sign_in_at: ago(2_000), app_metadata: { provider: "email" } }, NOW)).toBe(false);
    expect(isFreshOAuthSignup({ created_at: ago(5_000) }, NOW)).toBe(false);
    expect(isFreshOAuthSignup({ created_at: "not a date", app_metadata: { provider: "google" } }, NOW)).toBe(false);
  });

  it("is false for an existing Google account signing in again", () => {
    expect(isFreshOAuthSignup({ created_at: ago(30 * 24 * 3600_000), last_sign_in_at: ago(1_000), app_metadata: { provider: "google" } }, NOW)).toBe(false);
    // Created minutes ago, signed out and back in: not a second registration.
    expect(isFreshOAuthSignup({ created_at: ago(8 * 60_000), last_sign_in_at: ago(1_000), app_metadata: { provider: "google" } }, NOW)).toBe(false);
  });
});

describe("takeNewSignupCookie", () => {
  it("reads the sign-up kind once and clears the cookie", () => {
    const doc = { cookie: "_fbp=fb.1.2.3; lnh_new_signup=user; other=1" };
    vi.stubGlobal("document", doc);
    expect(takeNewSignupCookie()).toBe("user");
    expect(doc.cookie).toBe("lnh_new_signup=; Path=/; Max-Age=0; SameSite=Lax");
  });

  it("ignores missing or unexpected values", () => {
    vi.stubGlobal("document", { cookie: "lnh_new_signup=admin" });
    expect(takeNewSignupCookie()).toBeNull();
    vi.stubGlobal("document", { cookie: "" });
    expect(takeNewSignupCookie()).toBeNull();
  });
});

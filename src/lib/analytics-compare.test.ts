import { describe, expect, it } from "vitest";
import { buildCompareRows, gapPercent, googleChannelBucket, ourSourceBucket, shouldSendBrowserView, VIEW_REPEAT_WINDOW_MS } from "./analytics-compare";

describe("source buckets", () => {
  it("maps GA4 channel groups", () => {
    expect(googleChannelBucket("Organic Search")).toBe("organic_search");
    expect(googleChannelBucket("Organic Social")).toBe("organic_social");
    expect(googleChannelBucket("Paid Social")).toBe("paid_social");
    expect(googleChannelBucket("Direct")).toBe("direct");
    expect(googleChannelBucket("Email")).toBe("email");
    expect(googleChannelBucket("Unassigned")).toBe("other");
    expect(googleChannelBucket("Organic Video")).toBe("other");
  });

  it("maps our own sources, AI assistants with referrals like GA4", () => {
    expect(ourSourceBucket("ai_assistant")).toBe("referral");
    expect(ourSourceBucket("organic_social")).toBe("organic_social");
    expect(ourSourceBucket(null)).toBe("direct");
    expect(ourSourceBucket("something_new")).toBe("other");
  });
});

describe("comparison rows", () => {
  it("shows the gap as the share Google missed", () => {
    expect(gapPercent(100, 70)).toBe(30);
    expect(gapPercent(100, 110)).toBe(-10);
    expect(gapPercent(0, 5)).toBeNull();
    expect(gapPercent(10, null)).toBeNull();
  });

  it("lists views, visitors, then sources that have views", () => {
    const rows = buildCompareRows(
      { views: 100, visitors: 60, sources: { organic_search: 50, direct: 50 } },
      { views: 70, visitors: 45, sources: { organic_search: 40, direct: 25, other: 5 } },
    );
    expect(rows.map((r) => r.key)).toEqual(["views", "visitors", "source:organic_search", "source:direct", "source:other"]);
    expect(rows[0]).toMatchObject({ ours: 100, google: 70, gapPercent: 30 });
  });

  it("leaves Google empty when it is not connected", () => {
    const rows = buildCompareRows({ views: 5, visitors: 3, sources: { direct: 5 } }, null);
    expect(rows.every((r) => r.google === null && r.gapPercent === null)).toBe(true);
  });
});

describe("browser view repeat rule", () => {
  it("sends once per 30 minutes", () => {
    const t = 1_000_000_000;
    expect(shouldSendBrowserView(null, t)).toBe(true);
    expect(shouldSendBrowserView(t, t + 60_000)).toBe(false);
    expect(shouldSendBrowserView(t, t + VIEW_REPEAT_WINDOW_MS)).toBe(true);
    expect(shouldSendBrowserView(t + 5000, t)).toBe(true); // clock moved back
  });
});

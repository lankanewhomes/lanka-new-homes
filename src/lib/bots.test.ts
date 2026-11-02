import { describe, expect, it } from "vitest";
import { classifyBot, isGoodBotCategory, shouldSkipAnalytics } from "./bots";

const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

describe("allowlist is always allowed", () => {
  const cases: [string, string, string][] = [
    ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "search-engine"],
    ["Googlebot smartphone", "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36 (compatible; Googlebot/2.1)", "search-engine"],
    ["Google-InspectionTool", "Mozilla/5.0 (compatible; Google-InspectionTool/1.0)", "search-engine"],
    ["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", "search-engine"],
    ["DuckDuckBot", "DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)", "search-engine"],
    ["facebookexternalhit", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", "social-preview"],
    ["WhatsApp", "WhatsApp/2.23.20.0 A", "social-preview"],
    ["GPTBot", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)", "ai-search"],
    ["OAI-SearchBot", "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)", "ai-search"],
    ["ChatGPT-User", "Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)", "ai-search"],
    ["PerplexityBot", "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)", "ai-search"],
    ["ClaudeBot", "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", "ai-search"],
    ["Claude-SearchBot", "Claude-SearchBot/1.0", "ai-search"],
    ["Amazonbot", "Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)", "ai-search"],
  ];
  for (const [name, ua, category] of cases) {
    it(`${name} -> ${category}, allowed`, () => {
      const result = classifyBot(ua);
      expect(result.isBot).toBe(true);
      expect(result.action).toBe("allowed");
      expect(result.category).toBe(category);
      expect(isGoodBotCategory(result.category)).toBe(true);
    });
  }
  it("names Applebot-Extended as itself, not Applebot", () => {
    expect(classifyBot("Mozilla/5.0 (Applebot-Extended/0.1)").name).toBe("Applebot-Extended");
  });
});

describe("blocklist gets blocked", () => {
  for (const ua of ["Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)", "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)", "Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)", "Mozilla/5.0 (compatible; DotBot/1.2)", "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)", "Mozilla/5.0 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)"]) {
    it(ua.slice(0, 40), () => {
      const result = classifyBot(ua);
      expect(result.action).toBe("blocked");
      expect(result.category).toBe("seo-scraper");
    });
  }
});

describe("never blocks the wrong thing", () => {
  it("lets a normal browser through, not a bot", () => {
    expect(classifyBot(CHROME)).toEqual({ isBot: false, name: "", category: null, action: "allowed" });
  });
  it("logs an empty user-agent as unknown and allows it", () => {
    for (const empty of ["", "   ", null, undefined]) expect(classifyBot(empty)).toEqual({ isBot: true, name: "unknown", category: "unknown-bot", action: "allowed" });
  });
  it("allows (and logs) other bots and monitors", () => {
    expect(classifyBot("curl/8.4.0")).toMatchObject({ isBot: true, category: "unknown-bot", action: "allowed" });
    expect(classifyBot("python-requests/2.31")).toMatchObject({ isBot: true, action: "allowed" });
    expect(classifyBot("Mozilla/5.0 (compatible; UptimeRobot/2.0)")).toMatchObject({ isBot: true, category: "monitor", action: "allowed" });
    expect(classifyBot("Mozilla/5.0 Chrome-Lighthouse")).toMatchObject({ category: "monitor", action: "allowed" });
  });
  it("does not treat a CUBOT phone as a bot", () => {
    expect(classifyBot("Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36").isBot).toBe(false);
  });
  it("allowlist wins when a user-agent names both", () => {
    expect(classifyBot("Mozilla/5.0 (compatible; Googlebot/2.1) AhrefsBot").action).toBe("allowed");
  });
});

describe("shouldSkipAnalytics", () => {
  it("skips bots and automated browsers", () => {
    expect(shouldSkipAnalytics("Mozilla/5.0 (compatible; Googlebot/2.1)", false)).toBe(true);
    expect(shouldSkipAnalytics("HeadlessChrome/120", false)).toBe(true);
    expect(shouldSkipAnalytics(CHROME, true)).toBe(true);
    expect(shouldSkipAnalytics("curl/8", false)).toBe(true);
  });
  it("keeps real browsers", () => {
    expect(shouldSkipAnalytics(CHROME, false)).toBe(false);
    expect(shouldSkipAnalytics(CHROME, undefined)).toBe(false);
  });
});

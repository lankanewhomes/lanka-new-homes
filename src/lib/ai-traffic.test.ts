import { describe, expect, it } from "vitest";
import { classifyReferrer } from "./analytics-event";
import { isAiAssistantHost, isAiAssistantUtmSource } from "./ai-traffic";

describe("AI assistant traffic", () => {
  it("recognises assistant hosts, with or without www", () => {
    for (const host of ["chatgpt.com", "www.perplexity.ai", "claude.ai", "gemini.google.com", "copilot.microsoft.com", "chat.openai.com"]) expect(isAiAssistantHost(host)).toBe(true);
    for (const host of ["google.com", "www.google.lk", "facebook.com", "lankanewhomes.com", "notchatgpt.com.example.org"]) expect(isAiAssistantHost(host)).toBe(false);
  });
  it("recognises the utm_source ChatGPT adds", () => {
    expect(isAiAssistantUtmSource("chatgpt.com")).toBe(true);
    expect(isAiAssistantUtmSource("perplexity")).toBe(true);
    expect(isAiAssistantUtmSource("instagram")).toBe(false);
    expect(isAiAssistantUtmSource(undefined)).toBe(false);
  });
  it("classifies the referrer as ai_assistant before Google / referral", () => {
    expect(classifyReferrer("https://gemini.google.com/app", "lankanewhomes.com")).toBe("ai_assistant");
    expect(classifyReferrer("https://chatgpt.com/", "lankanewhomes.com")).toBe("ai_assistant");
    expect(classifyReferrer("https://www.google.com/", "lankanewhomes.com")).toBe("organic_search");
    expect(classifyReferrer("https://example.org/", "lankanewhomes.com")).toBe("referral");
  });
});

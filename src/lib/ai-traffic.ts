// Visitors who arrive from an AI assistant (owner, 2026-10-22: "I'm getting a lot of traffic through AI assistants"). ChatGPT adds
// ?utm_source=chatgpt.com to the links it cites; the others send a plain Referer. Used by the server-side referrer classifier
// (analytics-event.ts) and the browser one (ga4.ts) so AI traffic is its own channel instead of "referral" (or Google, for Gemini).

const AI_HOSTS = [
  "chatgpt.com", "chat.openai.com", "openai.com", "perplexity.ai", "claude.ai", "gemini.google.com", "bard.google.com",
  "copilot.microsoft.com", "you.com", "grok.com", "x.ai", "meta.ai", "chat.deepseek.com", "deepseek.com", "poe.com", "phind.com",
  "duck.ai", "chat.mistral.ai", "notebooklm.google.com", "kimi.com", "perplexity.com", "search.brave.com/ask",
];

const AI_SOURCE_WORDS = /chatgpt|openai|perplexity|claude|anthropic|gemini|copilot|grok|deepseek|mistral|phind|poe\.com|you\.com|meta\.ai/i;

/** Hostname such as "chatgpt.com" or "www.perplexity.ai" (no path). */
export function isAiAssistantHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, "");
  return AI_HOSTS.some((ai) => h === ai || h.endsWith(`.${ai}`));
}

/** The value of a utm_source parameter, e.g. "chatgpt.com". */
export function isAiAssistantUtmSource(source: string | undefined | null): boolean {
  return Boolean(source && AI_SOURCE_WORDS.test(source));
}

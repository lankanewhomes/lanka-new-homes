import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

// Lives at the app root on purpose: inside the (frontend) route group this
// file was silently ignored and /robots.txt 404'd on the live site
// (found 2026-09-08). sitemap.ts is fine in the group; robots.ts is not.

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const disallow = [
    "/admin/",
    "/developer/",
    "/cms/",
    "/payload-api/",
    "/account/",
    "/admin-login",
    "/listing-preview/",
    "/*?*view=map*",
    "/*?*&*",
  ];
  // AI assistants' crawlers are welcome (owner, 2026-10-01: "improve my AI search ... ChatGPT, Claude, Grok") —
  // named explicitly so it's clear they're allowed; each group repeats the private-area disallows because a
  // crawler follows only its own most specific group. /llms.txt is the site map written for them.
  const aiCrawlers = [
    "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai",
    "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "cohere-ai", "Bytespider", "meta-externalagent",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: aiCrawlers, allow: ["/", "/llms.txt"], disallow },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

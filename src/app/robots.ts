import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { ROBOTS_ALLOWED_BOTS, ROBOTS_DISALLOWED_BOTS } from "@/lib/bots";

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
    "/neighborhood-preview/",
    "/pricing-preview",
    "/*?*view=map*",
    "/*?*&*",
  ];
  // Search engines, social previews and AI assistants are welcome and named explicitly (owner, 2026-10-01 for AI; 2026-11-02 for the full
  // allowlist in src/lib/bots.ts); each group repeats the private-area disallows because a crawler follows only its own most specific group.
  // /llms.txt is the site map written for AI assistants. anthropic-ai and cohere-ai are AI crawlers outside the allowlist: welcome too.
  // Only the blocklist (AhrefsBot, SemrushBot... also answered with a 403 in middleware.ts) is disallowed.
  const welcome = [...new Set([...ROBOTS_ALLOWED_BOTS, "anthropic-ai", "cohere-ai"])];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: welcome, allow: ["/", "/llms.txt"], disallow },
      { userAgent: [...ROBOTS_DISALLOWED_BOTS], disallow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

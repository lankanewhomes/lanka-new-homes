import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

// Lives at the app root on purpose: inside the (frontend) route group this
// file was silently ignored and /robots.txt 404'd on the live site
// (found 2026-09-08). sitemap.ts is fine in the group; robots.ts is not.

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/developer/",
          "/cms/",
          "/payload-api/",
          "/account/",
          "/admin-login",
          "/listing-preview/",
          "/*?*view=map*",
          "/*?*&*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

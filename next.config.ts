import path from "node:path";
import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

// next/image only optimises hosts it has been told about. Media uploads are
// served from the R2 bucket's public URL (R2_PUBLIC_URL — a custom domain or
// the pub-….r2.dev subdomain), so allow that host when it's configured, plus
// any r2.dev subdomain so a temporary public URL works before the custom
// domain is attached.
const r2Host = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://scripts.clarity.ms",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://*.clarity.ms https://media.lankanewhomes.com https://*.r2.dev",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com https://www.facebook.com https://www.instagram.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Microsoft Clarity replays and heatmaps re-draw the page on clarity.microsoft.com, so the browser fetches our stylesheets and fonts
  // cross-origin. Without this header they are blocked and the replay shows an unstyled page (owner, 2026-10-15). Public, versioned
  // build files only. On Cloudflare the same rule lives in public/_headers (static assets bypass Next's header handling).
  // Browser-side protections on every page and API response (owner asked for the site to be locked down, 2026-11-01): HTTPS only
  // for a year, no guessing file types, no putting our pages inside someone else's frame (click-jacking), a stricter referrer,
  // and camera / microphone / payment switched off. A Content-Security-Policy is deliberately not here yet: Google Analytics,
  // Meta Pixel, Clarity and the embeds need a Report-Only trial first (see docs/security.md).
  async headers() {
    return [
      { source: "/_next/static/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] },
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
          // Trial run: the browser only REPORTS what this policy would block (see the console, "[Report Only]"), it blocks nothing.
          // When a week of real browsing shows no warnings for Analytics, Pixel, Clarity and the embeds, rename to Content-Security-Policy.
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
        ],
      },
    ];
  },
  poweredByHeader: false, // don't announce "Next.js, Payload" to scanners
  // Cloudflare Workers build only (CF_BUILD=1): give node-postgres a real Workers socket. See cloudflare/pg-cloudflare-socket.cjs.
  ...(process.env.CF_BUILD === "1" || process.env.WORKERS_CI === "1"
    ? {
        webpack: (config: { resolve: { alias?: Record<string, string> } }) => {
          config.resolve.alias = { ...(config.resolve.alias ?? {}), "pg-cloudflare$": path.join(process.cwd(), "cloudflare/pg-cloudflare-socket.cjs") };
          return config;
        },
      }
    : {}),
  // Fewer parallel page-builders keep the number of simultaneous database connections down during `next build`
  // (the Supabase pooler is small). Set NEXT_BUILD_CPUS=3 for Cloudflare builds; unset = Next default.
  ...(process.env.NEXT_BUILD_CPUS ? { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } } : {}),
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [60, 75],
    remotePatterns: [
      ...(r2Host ? [{ protocol: "https" as const, hostname: r2Host }] : []),
      {
        // All project photos, plans, brochures and logos live here (moved
        // out of public/ on 2026-09-08) — listed statically so an
        // environment without R2_PUBLIC_URL still renders them.
        protocol: "https",
        hostname: "media.lankanewhomes.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-east-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "dc0pnhvlit6k.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        // Homepage "Explore by city" tiles' real city photos.
        protocol: "https",
        hostname: "thumb.wikimedia.org",
      },
    ],
  },
  // /projects/colombo/luxury was already live and possibly indexed/bookmarked
  // before the "luxury" category was broadened to cover all of Sri Lanka
  // (2026-09-18), not just Colombo, and moved to /projects/luxury.
  async redirects() {
    return [
      // Vercel serves the homepage at /index too (breadcrumb showed "Home / Index"); send it to the real URL.
      { source: "/index", destination: "/", permanent: true },
      // NOTE (2026-11-05): the bare-domain -> www redirect that was here made www redirect to itself on the Cloudflare deploy (redirect loop,
      // site down), so it was removed. Do the lankanewhomes.com -> www.lankanewhomes.com redirect as a Cloudflare Redirect Rule instead.
      // Mistyped link seen in GA (Nov 2026): "ji-adore" instead of "j-adore".
      { source: "/projects/ji-adore-negombo", destination: "/projects/j-adore-negombo", permanent: true },
      {
        source: "/projects/colombo/luxury",
        destination: "/projects/luxury",
        permanent: true,
      },
    ];
  },
  /* config options here */
};

export default withPayload(nextConfig, { devBundleServerPackages: false });

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

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
  /* config options here */
};

export default withPayload(nextConfig, { devBundleServerPackages: false });

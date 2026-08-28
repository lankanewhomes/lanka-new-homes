import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
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
    ],
  },
  /* config options here */
};

export default nextConfig;

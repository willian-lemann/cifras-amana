import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { sentryConfig } from "./lib/next-config/sentry-config";
import { securityHeaders } from "./lib/next-config/headers";
import { allowedDevOrigins } from "./lib/next-config/subdomains";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins,
  productionBrowserSourceMaps: false,
  experimental: {
    viewTransition: true,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  serverExternalPackages: ["@prisma/adapter-pg", "sharp"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  skipTrailingSlashRedirect: true,
};

export default withSentryConfig(nextConfig, sentryConfig);

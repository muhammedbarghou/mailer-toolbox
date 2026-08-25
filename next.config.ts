import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * Content Security Policy.
 *
 * 'unsafe-inline' is required for scripts because the app ships inline JSON-LD
 * and Next.js injects its own inline bootstrap without a nonce. It still blocks
 * script loads from unapproved origins, which is what stops injected markup from
 * pulling in an attacker's payload. Pasted email HTML is sanitised before it is
 * rendered, so inline script is not reachable through user input.
 *
 * The dev-only relaxations (eval, localhost websockets) are keyed off the
 * Next.js build phase rather than NODE_ENV, because the phase is passed in by
 * the framework and cannot be reinterpreted by an ambient environment variable.
 * A production server therefore never emits them.
 */
const buildContentSecurityPolicy = (isDevelopment: boolean): string =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com${
      isDevelopment ? " ws://localhost:* http://localhost:*" : ""
    }`,
    "frame-src 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

const buildSecurityHeaders = (isDevelopment: boolean) => [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(isDevelopment),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const buildNextConfig = (phase: string): NextConfig => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    // SEO optimizations
    trailingSlash: false,
    poweredByHeader: false,
    compress: true,
    // Image optimization
    images: {
      formats: ["image/avif", "image/webp"],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 60,
    },
    // Headers for SEO and security
    async headers() {
      return [
        {
          source: "/:path*",
          headers: buildSecurityHeaders(isDevelopment),
        },
      ];
    },
  };
};

export default buildNextConfig;

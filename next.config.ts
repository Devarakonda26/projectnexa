import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/** The Supabase origin the browser may talk to (Storage uploads, public images). */
function supabaseOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
}
const supabase = supabaseOrigin();

/**
 * Content-Security-Policy. Next.js injects small inline scripts for hydration, so `script-src` needs 'unsafe-inline'
 * (a nonce-based policy would force every page to render dynamically). Everything else is locked down:
 * no plugins, no framing, forms and base URI limited to this site, connections limited to this site + Supabase.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`.trim(),
  "font-src 'self'",
  `connect-src 'self' ${supabase}${isProd ? "" : " ws: wss:"}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Payment proofs (5 MB) and custom-request attachments (20 MB) are uploaded through Server Actions.
  // Each action re-checks size and file type itself; this only raises the transport ceiling.
  experimental: { serverActions: { bodySizeLimit: "22mb" } },
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

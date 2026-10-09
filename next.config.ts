import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Payment proofs (5 MB) and custom-request attachments (20 MB) are uploaded through Server Actions.
  // Each action re-checks size and file type itself; this only raises the transport ceiling.
  experimental: { serverActions: { bodySizeLimit: "22mb" } },
  cacheComponents: true,
  partialPrefetching: true,
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

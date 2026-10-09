import { parsePublicEnv, type PublicEnv } from "./env.schema";

let cached: PublicEnv | undefined;

/**
 * Browser-safe environment. Next.js inlines NEXT_PUBLIC_* values at build
 * time only when they are referenced literally, so each one is listed
 * explicitly instead of passing `process.env` wholesale.
 */
export function publicEnv(): PublicEnv {
  cached ??= parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  return cached;
}

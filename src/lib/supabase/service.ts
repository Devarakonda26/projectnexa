import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env.public";
import { serverEnv } from "@/lib/env.server";

/**
 * Supabase client with the SERVICE ROLE key. It BYPASSES Row Level Security.
 *
 * Least-privilege rule: use it only for the few jobs that genuinely cannot run as the user, and ONLY after the
 * calling code has authorised the action itself. Currently allowed:
 *   - src/lib/storage/signed-urls.ts : mint short-lived signed URLs (after has_download_access() / admin check)
 *
 * Never import this from a Client Component, never return its results unfiltered, never log the key.
 * tests/security-hygiene.test.ts fails the build if another file starts importing this module.
 */
export function createServiceClient() {
  const env = publicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

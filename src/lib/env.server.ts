import "server-only";
import { parseServerEnv, type ServerEnv } from "./env.schema";

let cached: ServerEnv | undefined;

/**
 * Server-only environment. Importing this file from a Client Component fails
 * the build because of the `server-only` import above, which keeps
 * SUPABASE_SERVICE_ROLE_KEY out of browser bundles.
 */
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}

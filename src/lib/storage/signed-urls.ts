import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { serverEnv } from "@/lib/env.server";

/**
 * The ONLY place the service-role client is used. Callers must have authorised the request first:
 *  - downloads: `has_download_access(product_id)` returned true for the signed-in user (checked as that user, under RLS)
 *  - admin previews: `assertAdmin()` passed
 * URLs are short-lived (DOWNLOAD_URL_TTL_SECONDS) and generated per request, never stored.
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  opts: { downloadName?: string } = {},
): Promise<string | null> {
  if (!path || path.includes("..") || path.startsWith("/")) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, serverEnv().DOWNLOAD_URL_TTL_SECONDS, opts.downloadName ? { download: opts.downloadName } : undefined);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

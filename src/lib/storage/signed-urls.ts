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

/**
 * Signed URL for the newest file of a product. ONLY call after `has_download_access(productId)` returned true
 * for the signed-in user. Reading `product_files` needs the service role because customers have no RLS access
 * to storage paths.
 */
export async function signedUrlForLatestProductFile(productId: string): Promise<{ url: string; fileName: string } | null> {
  const supabase = createServiceClient();
  const { data: file } = await supabase
    .from("product_files")
    .select("storage_path, file_name")
    .eq("product_id", productId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!file) return null;
  const url = await createSignedUrl(serverEnv().STORAGE_BUCKET_PRODUCT_FILES, file.storage_path, { downloadName: file.file_name });
  return url ? { url, fileName: file.file_name } : null;
}
